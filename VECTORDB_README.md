# blackmind - Multi-Modelo Ensemble VectorDB

Proyecto configurado con Black Server usando **4 modelos de embeddings en ensemble** para búsqueda semántica superior.

## 🧠 Sistema Multi-Modelo Ensemble

Este proyecto utiliza 4 modelos de embeddings simultáneamente:

| Modelo | Dimensiones | Peso | Especialidad |
|--------|-------------|------|--------------|
| nomic-embed-text | 768 | 30% | General purpose, alta calidad |
| all-minilm:33m | 384 | 25% | Rápido, buen rendimiento |
| qwen3-embedding:0.6b | 768 | 25% | Multilingüe, código |
| embeddinggemma:300m | 768 | 20% | Google, código y texto |

### Ventajas del Ensemble:
- ✅ **Mayor precisión**: Combina fortalezas de cada modelo
- ✅ **Robustez**: Si un modelo falla, los otros continúan
- ✅ **Consenso**: Bonus por acuerdo entre modelos
- ✅ **Menos tokens**: Mejor contexto = menos tokens gastados

## 🚀 Inicio Rápido

```bash
# Iniciar servicios
docker compose up -d

# Verificar modelos disponibles
python vector_client.py models

# Ver estadísticas
python vector_client.py stats
```

## 📁 Archivos Generados

- `docker-compose.yml` - Qdrant con 4 colecciones
- `.env` - Variables de entorno
- `vector_client.py` - Cliente Python Multi-Modelo Ensemble
- `.env.example` - Plantilla de variables

## 📝 Uso del Cliente Python

### Buscar con Ensemble
```bash
# Búsqueda ensemble (usa los 4 modelos)
python vector_client.py search "cómo implementar autenticación JWT"

# Más resultados
python vector_client.py search "patrones de diseño" 10
```

### Indexar Documentos
```bash
# Indexa en las 4 colecciones simultáneamente
python vector_client.py index src/auth.py
python vector_client.py index README.md
python vector_client.py index docs/api.md
```

### Ver Estadísticas
```bash
python vector_client.py stats
python vector_client.py models
```

## 🔍 Algoritmo Ensemble

1. **Generación paralela**: Embeddings con los 4 modelos
2. **Búsqueda distribuida**: Cada modelo busca en su colección
3. **Fusión ponderada**: Reciprocal Rank Fusion con pesos
4. **Re-ranking**: Bonus por consenso entre modelos
5. **Resultados óptimos**: Top-K con mejor cobertura semántica

## 🛠️ Comandos Docker

```bash
# Detener servicios
docker compose down

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart
```

## 💡 Tips para Mejor Contexto

- **Indexa todo**: Código, docs, READMEs, comentarios
- **Chunking inteligente**: El sistema divide automáticamente
- **Metadatos ricos**: Guarda fuente, tipo, fecha
- **Búsquedas específicas**: Más contexto = mejor código generado

---
Configurado con [Black Server Multi-Modelo Ensemble](https://github.com/black-studio/black-server)
