<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useEnvStore } from "@/stores/env"
import { useRagStore } from "@/stores/rag"
import { Upload, FileText, Cog } from 'lucide-vue-next'

import SidebarRag from '@/components/rag/SidebarRag.vue';
import DocumentTable from '@/components/rag/DocumentTable.vue';
import DocumentUpload from '@/components/rag/DocumentUpload.vue';

const sidebarLeftOpen = ref(true)
const envStore = useEnvStore()
const ragStore = useRagStore()

// 当前选中的知识库
const selectedBase = computed(() => ragStore.selectedBase)

const opendoc = () => {
  window.open('https://docs.ee.chat/rag/about.html')
}
</script>

<template>
  <div class="flex relative overflow-hidden">
    <SidebarProvider
      class="w-auto"
      :style="{ '--sidebar-width': '200px' }"
      v-model:open="sidebarLeftOpen"
    >
      <SidebarRag />
    </SidebarProvider>
    <div class="w-full h-[calc(100dvh-30px)] max-h-[calc(100dvh-30px)] flex flex-col grow" :class="envStore.isWeb ? 'h-[100dvh] max-h-[100dvh]' : ''">
      <div class="p-4 flex justify-between items-center">
        <div class="px-3">
          <span v-if="selectedBase">{{ selectedBase.title }} - </span>
          {{ $t('rag.document.documentList') }}
        </div>
        <div class="flex items-center space-x-3">
          <DocumentUpload />
          <!-- <Button variant="outline"><Cog />{{ $t('rag.document.modelConfig') }}</Button> -->
          <Button variant="outline" @click="opendoc"><FileText />{{ $t('rag.document.help') }}</Button>
        </div>
      </div>
      <div class="p-4 pt-0">
        <DocumentTable />
      </div>
    </div>
  </div>
</template>