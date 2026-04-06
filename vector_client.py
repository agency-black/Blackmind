#!/usr/bin/env python3
"""
Black Server Client - Multi-Modelo Ensemble para VectorDB
Proyecto: blackmind

Sistema de embeddings ensemble que combina múltiples modelos
para búsquedas semánticas superiores.
"""

import os
import sys
import json
import requests
import concurrent.futures
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict

# Configuración
QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY', 'qdrant-local-key-2026')
OLLAMA_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
PROJECT_NAME = "blackmind"

# Modelos de embeddings en ensemble
EMBEDDING_MODELS = [
    {"name": "nomic-embed-text", "dimensions": 768, "weight": 0.30, "collection": f"{PROJECT_NAME}_nomic_embed_text", "desc": "General purpose, alta calidad"},
    {"name": "all-minilm:33m", "dimensions": 384, "weight": 0.25, "collection": f"{PROJECT_NAME}_all_minilm_33m", "desc": "Rápido, buen rendimiento"},
    {"name": "qwen3-embedding:0.6b", "dimensions": 768, "weight": 0.25, "collection": f"{PROJECT_NAME}_qwen3_embedding_0_6b", "desc": "Multilingüe, código"},
    {"name": "embeddinggemma:300m", "dimensions": 768, "weight": 0.20, "collection": f"{PROJECT_NAME}_embeddinggemma_300m", "desc": "Google, código y texto"},
]

@dataclass
class SearchResult:
    id: str
    score: float
    content: str
    metadata: Dict
    model_scores: Dict[str, float]
    ensemble_score: float


def get_embedding(text: str, model: str) -> Optional[List[float]]:
    """Genera embedding usando un modelo específico de Ollama."""
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": model, "prompt": text},
            timeout=30
        )
        response.raise_for_status()
        return response.json()["embedding"]
    except Exception as e:
        print(f"⚠ Error con modelo {model}: {e}")
        return None


def get_all_embeddings(text: str) -> Dict[str, Optional[List[float]]]:
    """Genera embeddings con todos los modelos en paralelo."""
    embeddings = {}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_to_model = {
            executor.submit(get_embedding, text, model["name"]): model 
            for model in EMBEDDING_MODELS
        }
        
        for future in concurrent.futures.as_completed(future_to_model):
            model = future_to_model[future]
            try:
                result = future.result()
                embeddings[model["name"]] = result
            except Exception as e:
                print(f"⚠ Error con {model['name']}: {e}")
                embeddings[model["name"]] = None
    
    return embeddings


def search_single_collection(
    query_embedding: List[float], 
    collection: str, 
    model_name: str,
    limit: int = 10
) -> List[Dict]:
    """Busca en una colección específica."""
    headers = {"api-key": QDRANT_API_KEY, "Content-Type": "application/json"}
    payload = {
        "vector": query_embedding,
        "limit": limit,
        "with_payload": True,
        "with_vectors": False
    }
    
    try:
        response = requests.post(
            f"{QDRANT_URL}/collections/{collection}/points/search",
            headers=headers,
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        results = response.json().get("result", [])
        return [{"model": model_name, **r} for r in results]
    except Exception as e:
        print(f"⚠ Error buscando en {collection}: {e}")
        return []


def ensemble_search(query: str, limit: int = 5, rerank_top_k: int = 20) -> List[SearchResult]:
    """Búsqueda ensemble que combina resultados de múltiples modelos."""
    print(f"🔍 Generando embeddings ensemble para: '{query[:50]}...'")
    
    # 1. Generar embeddings con todos los modelos
    embeddings = get_all_embeddings(query)
    
    # Verificar que al menos un modelo funcionó
    valid_embeddings = {k: v for k, v in embeddings.items() if v is not None}
    if not valid_embeddings:
        print("❌ Ningún modelo pudo generar embeddings")
        return []
    
    print(f"✓ Embeddings generados: {len(valid_embeddings)}/{len(EMBEDDING_MODELS)} modelos")
    
    # 2. Buscar en paralelo en todas las colecciones
    print("🔍 Buscando en colecciones...")
    all_results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = []
        for model in EMBEDDING_MODELS:
            if embeddings.get(model["name"]):
                future = executor.submit(
                    search_single_collection,
                    embeddings[model["name"]],
                    model["collection"],
                    model["name"],
                    rerank_top_k
                )
                futures.append((future, model))
        
        for future, model in futures:
            try:
                results = future.result()
                all_results.extend(results)
                print(f"  ✓ {model['name']}: {len(results)} resultados")
            except Exception as e:
                print(f"  ✗ Error con {model['name']}: {e}")
    
    if not all_results:
        print("❌ No se encontraron resultados")
        return []
    
    # 3. Fusionar resultados con Reciprocal Rank Fusion (RRF)
    print("🔄 Fusionando resultados con ensemble scoring...")
    
    # Agrupar por ID de documento
    doc_scores = defaultdict(lambda: {"scores": {}, "payload": None})
    
    for result in all_results:
        doc_id = result.get("id")
        model = result.get("model")
        score = result.get("score", 0)
        payload = result.get("payload", {})
        
        doc_scores[doc_id]["scores"][model] = score
        if doc_scores[doc_id]["payload"] is None:
            doc_scores[doc_id]["payload"] = payload
    
    # Calcular ensemble score ponderado
    final_results = []
    for doc_id, data in doc_scores.items():
        model_scores = data["scores"]
        payload = data["payload"]
        
        # Calcular score ponderado
        ensemble_score = 0
        for model in EMBEDDING_MODELS:
            model_name = model["name"]
            weight = model["weight"]
            score = model_scores.get(model_name, 0)
            ensemble_score += score * weight
        
        # Bonus por consenso (aparece en múltiples modelos)
        consensus_bonus = len(model_scores) * 0.05
        ensemble_score += consensus_bonus
        
        final_results.append(SearchResult(
            id=doc_id,
            score=max(model_scores.values()) if model_scores else 0,
            content=payload.get("content", "") if payload else "",
            metadata=payload if payload else {},
            model_scores=model_scores,
            ensemble_score=ensemble_score
        ))
    
    # 4. Ordenar por ensemble score
    final_results.sort(key=lambda x: x.ensemble_score, reverse=True)
    
    print(f"✓ Ensemble completado: {len(final_results)} documentos únicos")
    return final_results[:limit]


def index_document_ensemble(content: str, metadata: Optional[Dict] = None) -> Dict[str, bool]:
    """Indexa un documento en todas las colecciones (una por modelo)."""
    print(f"📄 Indexando documento ({len(content)} chars)...")
    
    # Generar embeddings con todos los modelos
    embeddings = get_all_embeddings(content)
    
    results = {}
    doc_id = str(__import__('uuid').uuid4())
    
    for model in EMBEDDING_MODELS:
        model_name = model["name"]
        collection = model["collection"]
        embedding = embeddings.get(model_name)
        
        if embedding is None:
            results[model_name] = False
            continue
        
        headers = {"api-key": QDRANT_API_KEY, "Content-Type": "application/json"}
        point = {
            "id": doc_id,
            "vector": embedding,
            "payload": {
                "content": content,
                **(metadata or {}),
                "indexed_by": model_name
            }
        }
        
        try:
            response = requests.put(
                f"{QDRANT_URL}/collections/{collection}/points",
                headers=headers,
                json={"points": [point]},
                timeout=10
            )
            response.raise_for_status()
            results[model_name] = True
            print(f"  ✓ Indexado en {model_name}")
        except Exception as e:
            print(f"  ✗ Error en {model_name}: {e}")
            results[model_name] = False
    
    success_count = sum(1 for v in results.values() if v)
    print(f"✓ Indexado en {success_count}/{len(EMBEDDING_MODELS)} colecciones")
    return results


def get_collection_stats():
    """Muestra estadísticas de todas las colecciones."""
    headers = {"api-key": QDRANT_API_KEY}
    
    print("\n📊 Estadísticas de Colecciones:")
    print("-" * 60)
    
    for model in EMBEDDING_MODELS:
        collection = model["collection"]
        try:
            response = requests.get(
                f"{QDRANT_URL}/collections/{collection}",
                headers=headers,
                timeout=5
            )
            if response.ok:
                data = response.json()
                points_count = data.get("result", {}).get("points_count", 0)
                print(f"  {collection:40s} {points_count:>6} docs")
            else:
                print(f"  {collection:40s} No existe")
        except Exception as e:
            print(f"  {collection:40s} Error: {e}")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("=" * 70)
        print("Black Server - Multi-Modelo Ensemble Client")
        print("=" * 70)
        print()
        print("Uso: python vector_client.py <comando> [args]")
        print()
        print("Comandos:")
        print("  search <query> [limit]     Buscar con ensemble (default: 5 resultados)")
        print("  index <archivo>            Indexar archivo en todas las colecciones")
        print("  stats                      Mostrar estadísticas de colecciones")
        print("  models                     Listar modelos configurados")
        print()
        print("Ejemplos:")
        print('  python vector_client.py search "cómo implementar autenticación" 10')
        print("  python vector_client.py index src/auth.py")
        print()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "search":
        if len(sys.argv) < 3:
            print("❌ Debes proporcionar una query")
            sys.exit(1)
        
        query = " ".join(sys.argv[2:])
        limit = 5
        
        # Parsear límite si se proporciona
        if sys.argv[-1].isdigit():
            limit = int(sys.argv[-1])
            query = " ".join(sys.argv[2:-1])
        
        results = ensemble_search(query, limit=limit)
        
        if not results:
            print("\n❌ No se encontraron resultados")
            sys.exit(0)
        
        print(f"\n{'='*70}")
        print(f"RESULTADOS ({len(results)} documentos)")
        print(f"{'='*70}\n")
        
        for i, r in enumerate(results, 1):
            print(f"[{i}] Ensemble Score: {r.ensemble_score:.4f}")
            print(f"    Max Score: {r.score:.4f}")
            print(f"    Modelos: {', '.join(f'{k}={v:.3f}' for k, v in r.model_scores.items())}")
            content = r.content[:300] if len(r.content) > 300 else r.content
            print(f"    Content: {content}...")
            print(f"    Metadata: {r.metadata}")
            print("-" * 70)
    
    elif command == "index":
        if len(sys.argv) < 3:
            print("❌ Debes proporcionar un archivo")
            sys.exit(1)
        
        file_path = sys.argv[2]
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            metadata = {
                "source": file_path,
                "filename": os.path.basename(file_path),
                "size": len(content)
            }
            
            results = index_document_ensemble(content, metadata)
            
            if any(results.values()):
                print(f"\n✅ Documento indexado exitosamente")
            else:
                print(f"\n❌ Error indexando documento")
        else:
            print(f"❌ Archivo no encontrado: {file_path}")
    
    elif command == "stats":
        get_collection_stats()
    
    elif command == "models":
        print("\n🤖 Modelos de Embeddings Configurados:")
        print("-" * 70)
        for model in EMBEDDING_MODELS:
            print(f"  • {model['name']}")
            print(f"    Dimensiones: {model['dimensions']}")
            print(f"    Peso: {model['weight']*100:.0f}%")
            print(f"    Colección: {model['collection']}")
            print()
    
    else:
        print(f"❌ Comando desconocido: {command}")
        print("Usa 'python vector_client.py' para ver la ayuda")
