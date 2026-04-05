<script setup lang="ts">
import { ref } from 'vue'

const sidebarLeftOpenMain = ref(false)
import { SidebarProvider, type SidebarProps } from '@/components/ui/sidebar'
import SidebarMain from '@/components/SidebarMain.vue'
const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})
import TitleBar from '@/components/TitleBar.vue'
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="fixed w-full h-full pointer-events-none">
      <img src="/photo.jpeg" alt="" 
      class="w-full h-[100dvh] object-cover opacity-[0.06] z-[-1] pointer-events-none">
      <!-- <div class="absolute inset-0 bg-black/5 backdrop-blur-[2px] z-[-2] pointer-events-none"></div> -->
    </div>
    <TitleBar class="h-[30px] w-full"></TitleBar>
    <div class="w-full flex">
      <SidebarProvider class="w-auto" v-model:open="sidebarLeftOpenMain">
        <SidebarMain></SidebarMain>
      </SidebarProvider>
      <div class="flex-1 overflow-auto relative z-10">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
