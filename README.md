# CryptoWatchlist: Plataforma de Seguimiento de Inversiones

¡Bienvenido a **CryptoWatchlist**! 🚀

Una **aplicación web interactiva** creada con **Next.js**, **Zustand** y **Material UI** para gestionar y monitorear tus inversiones en criptomonedas, acciones y divisas.

## 🔍 Características Principales

* **Gestión de Carteras**: Crea, edita y elimina carteras de inversión personalizadas
* **Múltiples Activos**: Añade criptomonedas, acciones y divisas a tus carteras
* **Visualización de Datos**: Visualiza el rendimiento de tus inversiones con datos en tiempo real
* **Selección Rápida de Divisas**: Interfaz intuitiva con chips seleccionables para divisas populares
* **Resumen de Conversión**: Visualización clara de tasas de cambio y valores equivalentes para divisas
* **Caché Inteligente**: Sistema que almacena datos por 300 minutos para optimizar llamadas a APIs
* **Manejo de Errores**: Datos de respaldo cuando las APIs no están disponibles
* **Interfaz Responsive**: Diseño adaptable a todos los dispositivos
* **Panel de Administración**: Gestiona el sistema de caché, prueba el estado de las APIs y configura claves API
* **Modo Demo**: Acceso simplificado con credenciales predefinidas para pruebas rápidas

## 🔧 Tecnologías

* **Framework**: Next.js (React)
* **Estado Global**: Zustand con persistencia
* **UI & Temas**: Material UI
* **Peticiones HTTP**: Axios
* **Fuentes de Datos**:
  * CoinGecko API (criptomonedas)
  * Alpha Vantage API (acciones)
  * Exchange Rate API (divisas)
* **Almacenamiento**: Local Storage para estado y caché
* **Despliegue**: Vercel (compatible)

## 🧩 Estructura del Proyecto

```
├── components/           # Componentes reutilizables
│   ├── assets/           # Componentes para diferentes tipos de activos
│   ├── forms/            # Formularios para añadir/editar carteras y activos
│   └── portfolio/        # Componentes relacionados con las carteras
├── pages/                # Páginas de la aplicación
│   ├── api/              # Endpoints de API (Next.js)
│   ├── admin.js          # Panel de administración y gestión de APIs
│   ├── investments.js    # Página principal de carteras
│   └── login.js          # Página de autenticación (acceso demo)
├── store/                # Estado global con Zustand
│   ├── AuthContext.js    # Contexto de autenticación
│   └── useInvestments.js # Store para inversiones
├── styles/               # Estilos y temas
└── utils/                # Utilidades y servicios
    ├── apiServices.js    # Servicios para comunicación con APIs con fallback
    ├── cacheService.js   # Sistema de caché para APIs
    └── formatCurrency.js # Utilidades para formateo de moneda
```

## 🚀 Características Destacadas

### 📊 Visualización Detallada de Conversiones

- **Resumen de Conversión en Divisas**: Al seleccionar una divisa, se muestra un resumen detallado que incluye:
  - Tipo de cambio actual
  - Equivalencia entre USD y la divisa seleccionada
  - Nombre completo de la divisa

### 🔄 Selección Rápida de Divisas

- **Chips Interactivos**: Interfaz intuitiva que permite seleccionar divisas populares con un solo clic
- **Indicador Visual**: Las divisas seleccionadas se destacan visualmente
- **Tooltips Informativos**: Información adicional al pasar el cursor

### ⚙️ Panel de Administración Mejorado

- **Configuración de APIs**: Interfaz para añadir y gestionar claves API
- **Depuración de Conexiones**: Herramientas para probar la conectividad con las APIs
- **Gestión de Caché**: Control detallado sobre los datos almacenados

### 🌐 Múltiples Fuentes de Datos con Respaldo

- **Resistencia a Fallos**: Sistemas de respaldo automático cuando las APIs no están disponibles
- **Mensajes Informativos**: Notificaciones claras sobre el estado de las conexiones
- **Soporte para Múltiples Servicios**: Compatibilidad con diferentes proveedores de APIs

### 🔐 Integración de Claves API

La aplicación permite configurar claves API directamente desde el panel de administración:

1. Navega a la sección `/admin`
2. Introduce tus claves API en los campos correspondientes:
   - Alpha Vantage API para datos de acciones
   - Exchange Rate API para conversión de divisas
3. Las claves se almacenan en sessionStorage por motivos de seguridad
4. Todas las solicitudes a API posteriores utilizarán tus claves configuradas

## 📦 Desarrollo Local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/crypto-watchlist.git
   cd crypto-watchlist
   ```

2. Instala dependencias:

   ```bash
   npm install
   ```

3. Ejecuta en modo desarrollo:

   ```bash
   npm run dev
   ```

4. Abre tu navegador en `http://localhost:3000` para ver la app.

5. **Acceso Demo**: Usa las credenciales predefinidas en la pantalla de login.

## 📋 Implementación CRUD

La aplicación implementa operaciones CRUD (Create, Read, Update, Delete) para gestionar carteras y activos:

### Carteras de Inversión
- **CREATE**: Creación de nuevas carteras con nombre y descripción
- **READ**: Visualización de carteras existentes y sus activos
- **UPDATE**: Edición del nombre y descripción de las carteras
- **DELETE**: Eliminación de carteras completas

### Activos Financieros
- **CREATE**: Añadir activos (cripto, acciones, divisas) a carteras existentes
- **READ**: Visualizar activos dentro de cada cartera con datos actualizados
- **UPDATE**: Actualizar los datos de los activos (precios actualizados)
- **DELETE**: Vender/eliminar activos de las carteras

## 🔄 Sistema de Caché y Gestión de Errores

Para optimizar el rendimiento y manejar las limitaciones de las APIs:

* **Caché Inteligente**: Almacena respuestas de API durante 300 minutos (5 horas)
* **Persistencia de Datos**: Usa localStorage para mantener datos entre sesiones
* **Indicadores de Estado**: Muestra claramente cuando se usan datos en caché o de respaldo
* **Fallback Automático**: 
  - Divisas: Conjunto completo de tasas de cambio predefinidas
  - Acciones: Datos de referencia para acciones populares
  - Criptomonedas: Precios y datos históricos de referencia

## 📱 Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: PC, tablets y móviles
- **Plataformas**: Compatible con despliegue en Vercel, Netlify y otros servicios

## 📝 Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir:

1. Haz fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Realiza tus cambios y haz commit (`git commit -m 'Añade nueva característica'`)
4. Sube tus cambios (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

---

¡Gracias por usar CryptoWatchlist! 🚀