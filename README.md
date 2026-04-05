# Blackmind

Proyecto Electron + React con una UI tipo navegador y una gran parte de la orquestacion en [`index.html`](/Users/salvadoraguilar/Desktop/Wrapper-main%20--/index.html).

Documentacion principal:

- [`docs/architecture/README.md`](/Users/salvadoraguilar/Desktop/Wrapper-main%20--/docs/architecture/README.md)
- [`docs/architecture/PROJECT_STRUCTURE.md`](/Users/salvadoraguilar/Desktop/Wrapper-main%20--/docs/architecture/PROJECT_STRUCTURE.md)
- [`docs/testing/performance-testing.md`](/Users/salvadoraguilar/Desktop/Wrapper-main%20--/docs/testing/performance-testing.md)
- [`docs/features/context-menu.md`](/Users/salvadoraguilar/Desktop/Wrapper-main%20--/docs/features/context-menu.md)

## 🔐 Requisitos de Seguridad

### Gestor de Contraseñas

El gestor de contraseñas integrado requiere un **keychain/keyring del sistema** disponible para funcionar correctamente:

| Sistema | Requisito |
|---------|-----------|
| **macOS** | Keychain (disponible por defecto) |
| **Windows** | Credential Manager (disponible por defecto) |
| **Linux** | GNOME Keyring o KWallet |

#### Comportamiento en entornos sin keychain

En entornos donde `safeStorage.isEncryptionAvailable()` retorna `false`:

- **No se almacenarán contraseñas** - La operación fallará de forma segura
- **Se emitirá un evento** `security:storage-unavailable` al renderer
- **Logs de advertencia** se registrarán en consola

#### Entornos afectados

- Linux sin keyring instalado
- Máquinas virtuales sin servicios de keychain
- Entornos CI/CD sin acceso al keyring
- Contenedores Docker sin configuración de keyring

#### Solución en Linux

```bash
# GNOME Keyring (recomendado)
sudo apt install gnome-keyring

# O KWallet
sudo apt install kwallet
```

### Eventos de Seguridad

El renderer puede escuchar el evento `security:storage-unavailable`:

```javascript
ipcRenderer.on('security:storage-unavailable', (event, data) => {
  console.warn('Almacenamiento seguro no disponible:', data.reason);
  // data.operation = 'passwords:set'
  // data.reason = 'safeStorage no disponible...'
});
```
