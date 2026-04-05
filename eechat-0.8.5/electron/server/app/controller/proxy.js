const { Controller } = require('egg');

class ProxyController extends Controller {
  // 获取当前代理设置
  async getProxyConfig() {
    const { ctx } = this;
    
    try {
      const config = await ctx.service.proxy.getProxyConfig();
      ctx.body = ctx.helper.success(config);
    } catch (error) {
      ctx.logger.error('获取代理配置失败:', error);
      ctx.body = ctx.helper.error(error.message);
    }
  }

  // 更新代理设置
  async updateProxyConfig() {
    const { ctx } = this;
    const proxyConfig = ctx.request.body;
    
    try {
      const result = await ctx.service.proxy.updateProxyConfig(proxyConfig);
      ctx.body = ctx.helper.success(result);
    } catch (error) {
      ctx.logger.error('更新代理配置失败:', error);
      ctx.body = ctx.helper.error(error.message);
    }
  }

  // 启用代理
  async enableProxy() {
    const { ctx } = this;
    
    try {
      const result = await ctx.service.proxy.enableProxy();
      ctx.body = ctx.helper.success(result);
    } catch (error) {
      ctx.logger.error('启用代理失败:', error);
      ctx.body = ctx.helper.error(error.message);
    }
  }

  // 禁用代理
  async disableProxy() {
    const { ctx } = this;
    
    try {
      const result = await ctx.service.proxy.disableProxy();
      ctx.body = ctx.helper.success(result);
    } catch (error) {
      ctx.logger.error('禁用代理失败:', error);
      ctx.body = ctx.helper.error(error.message);
    }
  }
}

module.exports = ProxyController;