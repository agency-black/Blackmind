<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'
import { proxyApi } from '@/api/request'
import { Loader2 } from 'lucide-vue-next'

const { t } = useI18n()
const { toast } = useToast()
const loading = ref(false)

// SOCKS代理配置
const proxyConfig = reactive({
  enabled: false,
  host: '127.0.0.1',
  port: 7897,
  username: '',
  password: ''
})

// 获取代理配置
const getProxyConfig = async () => {
  try {
    loading.value = true
    const config = await proxyApi.getProxyConfig()
    Object.assign(proxyConfig, config)
  } catch (error: any) {
    toast({
      title: t('settings.proxy.getConfigFailed', '获取代理配置失败'),
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// 更新代理配置
const updateProxyConfig = async () => {
  try {
    loading.value = true
    await proxyApi.updateProxyConfig({
      host: proxyConfig.host,
      port: proxyConfig.port,
      username: proxyConfig.username,
      password: proxyConfig.password
    })
    toast({
      title: t('settings.proxy.updateSuccess', '更新代理配置成功'),
      description: t('settings.proxy.updateSuccessDesc', '代理配置已成功更新并立即生效')
    })
  } catch (error: any) {
    toast({
      title: t('settings.proxy.updateFailed', '更新代理配置失败'),
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// 切换代理状态
const toggleProxy = async () => {
  try {
    loading.value = true
    if (proxyConfig.enabled) {
      await proxyApi.disableProxy()
      toast({
        title: t('settings.proxy.disableSuccess', '禁用代理成功'),
        description: t('settings.proxy.disableSuccessDesc', '代理已成功禁用')
      })
    } else {
      await proxyApi.enableProxy()
      toast({
        title: t('settings.proxy.enableSuccess', '启用代理成功'),
        description: t('settings.proxy.enableSuccessDesc', '代理已成功启用')
      })
    }
    // 重新获取配置以确保状态同步
    await getProxyConfig()
  } catch (error: any) {
    toast({
      title: proxyConfig.enabled 
        ? t('settings.proxy.disableFailed', '禁用代理失败') 
        : t('settings.proxy.enableFailed', '启用代理失败'),
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取配置
onMounted(() => {
  getProxyConfig()
})
</script>

<template>
  <div class="h-full space-y-6">
    <div class="text-gray-500 text-sm">
      {{ t('settings.proxy.title', 'SOCKS代理设置') }}
    </div>
    
    <div class="space-y-4">
      <!-- 代理开关 -->
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium">{{ t('settings.proxy.enableProxy', '启用SOCKS代理') }}</div>
          <div class="text-xs text-muted-foreground">
            {{ t('settings.proxy.enableProxyDesc', '启用后，应用将通过SOCKS代理服务器连接网络') }}
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <Switch 
            :model-value="proxyConfig.enabled"
            @update:model-value="toggleProxy" 
            :disabled="loading"
          />
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        </div>
      </div>
      
      <!-- 代理服务器地址 -->
      <div class="space-y-2">
        <Label for="proxy-host">{{ t('settings.proxy.socksAddress', '代理服务器地址') }}</Label>
        <Input 
          id="proxy-host" 
          v-model="proxyConfig.host" 
          :placeholder="t('settings.proxy.proxyPlaceholder', '例如: 127.0.0.1')"
        />
      </div>
      
      <!-- 代理端口 -->
      <div class="space-y-2">
        <Label for="proxy-port">{{ t('settings.proxy.socksPort', '代理端口') }}</Label>
        <Input 
          id="proxy-port" 
          v-model.number="proxyConfig.port" 
          type="number"
          :placeholder="t('settings.proxy.portPlaceholder', '例如: 7897')"
        />
      </div>
      
      <!-- 用户名（可选） -->
      <div class="space-y-2">
        <Label for="proxy-username">{{ t('settings.proxy.socksUsername', '用户名（可选）') }}</Label>
        <Input 
          id="proxy-username" 
          v-model="proxyConfig.username" 
          :placeholder="t('settings.proxy.usernamePlaceholder', '如果代理需要认证请填写')"
        />
      </div>
      
      <!-- 密码（可选） -->
      <div class="space-y-2">
        <Label for="proxy-password">{{ t('settings.proxy.socksPassword', '密码（可选）') }}</Label>
        <Input 
          id="proxy-password" 
          v-model="proxyConfig.password" 
          type="password"
          :placeholder="t('settings.proxy.passwordPlaceholder', '如果代理需要认证请填写')"
        />
      </div>
      
      <!-- 保存按钮 -->
      <Button 
        @click="updateProxyConfig" 
        :disabled="loading"
        class="mt-4"
      >
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ t('common.save', '保存') }}
      </Button>
    </div>
  </div>
</template>

<style scoped></style>