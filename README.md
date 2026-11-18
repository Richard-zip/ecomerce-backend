# 🎓 CampusMarket • Centro Tutorial Cereté 🛒

> **Plataforma Integral de Comercio Electrónico Estudiantil para el Centro Tutorial Cereté (Universidad de Cartagena).**  
> Facilita la compra, venta, intercambio y solicitud de libros, calculadoras, útiles, tecnología, indumentaria y servicios entre estudiantes, con coordinación de entregas seguras en el campus, checkout directo por WhatsApp, analíticas para vendedores y despliegue serverless optimizado. Precios localizados en Pesos Colombianos (COP).

---

## 📑 Tabla de Contenidos

1. [Visión General del Proyecto](#-visión-general-del-proyecto)
2. [Novedades y Nuevas Funcionalidades](#-novedades-y-nuevas-funcionalidades)
3. [Características Principales del Sistema](#-características-principales-del-sistema)
4. [Diagramas de Arquitectura y Flujos](#-diagramas-de-arquitectura-y-flujos)
   - [1. Arquitectura General del Sistema & Serverless](#1-arquitectura-general-del-sistema--serverless)
   - [2. Diagrama Entidad-Relación (ERD) Completo](#2-diagrama-entidad-relación-erd-completo)
   - [3. Flujo de Autenticación Unificada y Alternancia de Rol](#3-flujo-de-autenticación-unificada-y-alternancia-de-rol)
   - [4. Flujo de Solicitudes Estudiantiles y Ofertas (Marketplace Inverso)](#4-flujo-de-solicitudes-estudiantiles-y-ofertas-marketplace-inverso)
   - [5. Flujo de Pedidos y Transacción Atómica de Stock](#5-flujo-de-pedidos-y-transacción-atómica-de-stock)
   - [6. Flujo de Recuperación de Contraseña con Gmail SMTP](#6-flujo-de-recuperación-de-contraseña-con-gmail-smtp)
   - [7. Visualizador Multi-ángulo 360° y Zoom al Cursor](#7-visualizador-multi-ángulo-360-y-zoom-al-cursor)
5. [Módulo de Analíticas para Vendedores (BI & Rendimiento)](#-módulo-de-analíticas-para-vendedores-bi--rendimiento)
6. [Sistema de Solicitudes Estudiantiles](#-sistema-de-solicitudes-estudiantiles)
7. [Compra Rápida y Coordinación vía WhatsApp](#-compra-rápida-y-coordinación-vía-whatsapp)
8. [Stack Tecnológico y Dependencias](#-stack-tecnológico-y-dependencias)
9. [Arquitectura de Software y Decisiones Técnicas](#-arquitectura-de-software-y-decisiones-técnicas)
   - [Patrón en Capas (Layered Architecture)](#patrón-en-capas-layered-architecture)
   - [Validación Estricta con Zod y Manejo Centralizado de Excepciones](#validación-estricta-con-zod-y-manejo-centralizado-de-excepciones)
   - [Estrategia de Base de Datos: Connection Pooling y Direct URL](#estrategia-de-base-de-datos-connection-pooling-y-direct-url)
   - [Patrón Singleton para Prisma Client](#patrón-singleton-para-prisma-client)
   - [Transacciones Atómicas ACID y Prevención de Race Conditions](#transacciones-atómicas-acid-y-prevención-de-race-conditions)
   - [Gestión de Multimedia en Memoria con Vercel Blob](#gestión-de-multimedia-en-memoria-con-vercel-blob)
   - [Seguridad Criptográfica y Autenticación RBAC](#seguridad-criptográfica-y-autenticación-rbac)
   - [Pipeline de Scripts NPM y Automatización](#pipeline-de-scripts-npm-y-automatización)
10. [Estructura del Repositorio](#-estructura-del-repositorio)
11. [Guía de Configuración, Instalación y Despliegue](#-guía-de-configuración-instalación-y-despliegue)
    - [Variables de Entorno Backend (`.env`)](#variables-de-entorno-backend-env)
    - [Variables de Entorno Frontend (`.env`)](#variables-de-entorno-frontend-env)
    - [Comandos de Puesta en Marcha Local](#comandos-de-puesta-en-marcha-local)
    - [Despliegue Serverless en Vercel](#despliegue-serverless-en-vercel)
12. [Referencia Completa de la API RESTful](#-referencia-completa-de-la-api-restful)
13. [Seguridad, Reglas de Negocio e Integridad](#-seguridad-reglas-de-negocio-e-integridad)
14. [Créditos Institucionales](#-créditos-institucionales)

---

## 🌟 Visión General del Proyecto

**CampusMarket** nace de la necesidad de conectar a la comunidad universitaria del **Centro Tutorial Cereté** para intercambiar bienes y servicios académicos de manera directa, transparente y segura.

A diferencia de los e-commerce convencionales, la plataforma está 100% contextualizada al entorno estudiantil de Cereté:
- **Precios en Pesos Colombianos (COP)** con formateo localizado.
- **Puntos de encuentro dentro del campus** (Biblioteca, Cafetería, Pasillo Central, Kiosco de Estudio).
- **Cuenta única estudiantil con alternancia dinámica de rol**: Un único registro permite actuar como Comprador (`CLIENTE`) o Vendedor (`VENDEDOR`) sin duplicación de credenciales.
- **Marketplace inverso de solicitudes**: Si un estudiante busca un libro, calculadora o tutoría que no está en el catálogo, puede publicar una solicitud abierta para que los vendedores le coticen u oferten.
- **Checkout directo por WhatsApp**: Enlace preconfigurado para contactar al vendedor al instante con los datos de la compra.
- **Recuperación segura de contraseña**: Códigos de 6 dígitos enviados por **Gmail SMTP** con caducidad estricta.
- **Visualizador interactivo multi-ángulo (360°)** y zoom dinámico al pasar el cursor para inspeccionar el estado real de los artículos.
- **Panel analítico de métricas de ventas y salud de inventario** para los vendedores del campus.

---

## ✨ Novedades y Nuevas Funcionalidades

En las versiones más recientes se han incorporado importantes características de negocio y optimizaciones de infraestructura:

1. **📢 Módulo de Solicitudes Estudiantiles (`StudentRequest` & `RequestOffer`)**:
   - Tablero donde cualquier estudiante puede publicar requerimientos académicos (*"Busco libro de Cálculo Diferencial Stewart 7ma edición"*, *"Necesito calculadora científica Casio para parcial de física"*).
   - Presupuesto máximo estimado (`maxBudget`), carrera universitaria y campus.
   - Los vendedores pueden responder directamente con propuestas comerciales u ofertas (`RequestOffer`), sugiriendo un precio y vinculando opcionalmente productos de su inventario.
   - Ciclo de vida completo: `OPEN` (abierta), `RESOLVED` (atendida/resuelta) y `CLOSED` (cerrada).

2. **📊 Tablero de Analíticas de Rendimiento para Vendedores (`/api/orders/seller/analytics`)**:
   - Ingresos consolidados por órdenes entregadas (`totalDeliveredRevenue`) e ingresos en curso/potenciales (`potentialRevenue`).
   - Tasa de efectividad de entrega (`deliveredRate`) y ticket promedio de venta (`averageOrderValue`).
   - Distribución de pedidos por estado (`PENDING`, `CONFIRMED`, `DELIVERED`, `CANCELLED`).
   - Tendencia de facturación mensual histórica (últimos 6 meses).
   - Top 5 productos más vendidos clasificados por volumen de unidades e ingresos generados.
   - Diagnóstico en tiempo real de salud de inventario (artículos disponibles, pausados, agotados y total de existencias).
   - Calificación promedio del vendedor y desglose de satisfacción (1 a 5 estrellas).

3. **🔐 Modelo de Autenticación Unificada con Correo Único (`@unique email`)**:
   - Restricción estricta de unicidad en base de datos para prevenir duplicados.
   - La alternancia de rol (`/api/auth/switch-role`) actualiza el estado activo del usuario y emite de inmediato un nuevo token JWT sin duplicar cuentas en la base de datos ni generar desincronización de pedidos o productos.

4. **🛡️ Eliminación Segura y en Cascada de Productos (`deleteProduct`)**:
   - Transacción atómica `$transaction` para eliminar de forma segura productos, depurando con integridad relacional sus reseñas e items asociados sin romper llaves foráneas.
   - Filtrado perfeccionado del catálogo público: productos pausados (`PAUSED`) no se exponen al catálogo general de compras.

5. **⚡ Despliegue Serverless en Vercel & Auto-Seeding en la Nube**:
   - Adaptación completa para serverless en Vercel (`api/index.ts` y `vercel.json`).
   - Configuración de targets binarios de Prisma para entornos serverless Linux (`rhel-openssl-3.0.x`, `debian-openssl-3.0.x`).
   - Auto-poblado inteligente (*auto-seeding on-demand*) de las 7 categorías oficiales universitarias si la base de datos se despliega en frío.
   - Endpoints de verificación de estado y salud (`/` y `/health`).

---

## 🚀 Características Principales del Sistema

### 1. Cuentas Estudiantiles Unificadas y Cambio Dinámico de Modo
- Registro con correo institucional o personal.
- Alternancia con 1 solo clic en la barra de navegación entre modo **Comprador** y **Vendedor**.
- Emisión instantánea de credenciales JWT con el contexto actualizado.

### 2. Recuperación de Contraseña Segura vía Gmail SMTP
- Integración nativa con **Google Gmail SMTP** y plantillas HTML con la paleta de colores de Cereté (Azul Marino `#102A43` y Dorado `#D6A84F`).
- Generación de código numérico aleatorio de **6 dígitos** con tiempo de vida estricto de **15 minutos**.
- Botón de visibilidad de contraseña (👁️ ver / ocultar) en formularios.

### 3. Visualizador de Producto 360° Multi-ángulo y Zoom al Cursor
- Permite subir y visualizar múltiples fotografías desde distintos ángulos.
- Miniaturas dinámicas y carrusel.
- Lupa de zoom interactiva (`transform scale 2.2x`) que se posiciona según el movimiento del cursor.

### 4. Control Atómico de Inventario y Pedidos en Campus
- Reserva de producto mediante transacción **ACID** en PostgreSQL (`$transaction`), descontando stock de inmediato.
- Si un pedido es cancelado por el comprador o rechazado por el vendedor, el stock se **repone automáticamente**.

### 5. Categorías Universitarias Auto-configuradas
- Siete categorías oficiales con auto-poblado en el arranque o consulta inicial:
  1. 📚 **Libros y Manuales**
  2. 💻 **Tecnología y Calculadoras**
  3. ✏️ **Papelería y Útiles**
  4. 🥪 **Snacks y Comida**
  5. 👕 **Ropa y Merchandising**
  6. 🖨️ **Servicios e Impresiones**
  7. 🎒 **Varios y Accesorios**

---

## 📊 Diagramas de Arquitectura y Flujos

### 1. Arquitectura General del Sistema & Serverless

```mermaid
flowchart TD
    subgraph Frontend["Frontend SPA (React 19 + Vite + Tailwind CSS)"]
        UI["Interfaz de Usuario (Cereté Theme)"]
        State["Contextos (AuthContext, CartContext)"]
        ServiceLayer["Servicios API (Axios / Fetch)"]
        UI --> State
        State --> ServiceLayer
    end

    subgraph Backend["Backend API (Node.js + Express 5 + TypeScript)"]
        EntryServerless["Vercel Serverless Handler (api/index.ts)"]
        Router["Enrutador Central (/api)"]
        Middlewares["Middlewares (Auth JWT, Roles, Multer, ErrorHandler)"]
        Controllers["Controladores (Auth, Products, Orders, Requests, Categories, Users)"]
        Services["Lógica de Negocio (AuthService, RequestsService, OrdersService, etc.)"]
        PrismaORM["Prisma ORM Client"]

        EntryServerless --> Router
        Router --> Middlewares
        Middlewares --> Controllers
        Controllers --> Services
        Services --> PrismaORM
    end

    subgraph CloudServices["Infraestructura y Servicios en la Nube"]
        NeonDB[("PostgreSQL Serverless (Neon DB)")]
        VercelBlob["Vercel Blob Storage (CDN de Fotos de Productos y Avatares)"]
        GmailSMTP["Servidor Google Gmail SMTP (Nodemailer)"]
        WhatsAppAPI["WhatsApp Web / Deep Linking (Checkout Directo)"]
    end

    ServiceLayer -->|Peticiones HTTP REST / JSON| EntryServerless
    PrismaORM -->|Consultas SQL Seguras & ACID| NeonDB
    Services -->|Subida de Archivos Multipart| VercelBlob
    Services -->|Envío de Códigos de Verificación| GmailSMTP
    Frontend -.->|Redirección con Mensaje Estructurado| WhatsAppAPI
```

---

### 2. Diagrama Entidad-Relación (ERD) Completo

```mermaid
erDiagram
    User ||--o{ Product : "publica como vendedor"
    User ||--o{ Order : "crea como comprador"
    User ||--o{ Order : "recibe como vendedor"
    User ||--o{ Review : "califica como comprador"
    User ||--o{ Review : "recibe como vendedor"
    User ||--o{ StudentRequest : "publica requerimientos"
    User ||--o{ RequestOffer : "realiza ofertas"

    Category ||--o{ Product : "clasifica"
    Order ||--|{ OrderItem : "contiene"
    Product ||--o{ OrderItem : "se incluye en"
    Product ||--o{ Review : "recibe reseñas"
    Product ||--o{ RequestOffer : "vinculado opcionalmente"
    StudentRequest ||--o{ RequestOffer : "recibe ofertas"

    User {
        string id PK
        string name
        string email UK
        string password
        string phone
        string whatsapp
        enum role "CLIENTE | VENDEDOR"
        string avatar
        string career
        string campus "Centro Tutorial Cereté"
        string resetToken
        datetime resetTokenExpires
        datetime createdAt
        datetime updatedAt
    }

    Category {
        string id PK
        string name UK
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    Product {
        string id PK
        string title
        string description
        float price
        int stock
        string[] images
        enum condition "NUEVO | COMO_NUEVO | USADO_BUENO | USADO_REGULAR"
        enum status "AVAILABLE | PAUSED | SOLD_OUT"
        string meetingPoint
        string sellerId FK
        string categoryId FK
        datetime createdAt
        datetime updatedAt
    }

    Order {
        string id PK
        int orderNumber UK
        enum status "PENDING | CONFIRMED | DELIVERED | CANCELLED"
        float totalAmount
        string meetingPoint
        string notes
        string buyerId FK
        string sellerId FK
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        float unitPrice
        datetime createdAt
    }

    Review {
        string id PK
        int rating "1 a 5 estrellas"
        string comment
        string buyerId FK
        string sellerId FK
        string productId FK
        datetime createdAt
    }

    StudentRequest {
        string id PK
        string title
        string description
        float maxBudget "COP"
        string career
        string campus
        enum status "OPEN | RESOLVED | CLOSED"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    RequestOffer {
        string id PK
        string message
        float price "COP"
        string productId FK
        string requestId FK
        string sellerId FK
        datetime createdAt
    }
```

---

### 3. Flujo de Autenticación Unificada y Alternancia de Rol

```mermaid
sequenceDiagram
    autonumber
    actor Estudiante as Estudiante Universitario
    participant Front as Frontend (Navbar / AuthContext)
    participant Back as Backend (/api/auth)
    participant DB as Neon PostgreSQL

    Estudiante->>Front: Inicia sesión (email y password)
    Front->>Back: POST /api/auth/login { email, password }
    Back->>DB: Busca usuario por email único
    DB-->>Back: Usuario encontrado con su hash bcrypt
    Back->>Back: Valida contraseña y firma JWT
    Back-->>Front: { token, user: { id, name, role, email, career, campus } }
    Front-->>Estudiante: Acceso al rol actual (ej: CLIENTE)

    opt Cambio Dinámico de Modalidad (Switch Role)
        Estudiante->>Front: Clic en "Cambiar a Vendedor"
        Front->>Back: POST /api/auth/switch-role { targetRole: "VENDEDOR" }
        Back->>DB: Actualiza role en la cuenta existente
        DB-->>Back: Registro actualizado
        Back->>Back: Genera nuevo JWT con role="VENDEDOR"
        Back-->>Front: { token, user, message: "Modo Vendedor activado" }
        Front-->>Estudiante: Redirige fluidamente a las herramientas de vendedor
    end
```

---

### 4. Flujo de Solicitudes Estudiantiles y Ofertas (Marketplace Inverso)

```mermaid
sequenceDiagram
    autonumber
    actor Alumno as Estudiante Comprador
    participant Board as Tablero de Solicitudes (/requests)
    participant Back as Backend API (/api/requests)
    actor Vendedor as Compañero Vendedor
    participant DB as Neon PostgreSQL

    Alumno->>Board: Publica necesidad (ej: "Calculadora Casio fx-570LA Plus", Max COP $70.000)
    Board->>Back: POST /api/requests { title, description, maxBudget, career }
    Back->>DB: Inserta StudentRequest (status: OPEN)
    DB-->>Back: Registro creado
    Back-->>Board: Solicitud listada públicamente

    Vendedor->>Board: Explora solicitudes de su carrera o campus
    Vendedor->>Back: POST /api/requests/:id/offers { message, price: 65000, productId }
    Back->>DB: Crea RequestOffer vinculada
    DB-->>Back: Oferta registrada
    Back-->>Vendedor: Oferta enviada con éxito

    Alumno->>Board: Revisa ofertas recibidas con datos de contacto del vendedor
    Alumno->>Back: PATCH /api/requests/:id/status { status: "RESOLVED" }
    Back->>DB: Marca solicitud como resuelta
    DB-->>Back: Actualizado
    Back-->>Alumno: Solicitud finalizada satisfactoriamente
```

---

### 5. Flujo de Pedidos y Transacción Atómica de Stock

```mermaid
flowchart TD
    Start(["Comprador añade productos al carrito"]) --> ReviewCart["Revisión de Carrito y Lugar de Encuentro en Cereté"]
    ReviewCart --> SubmitOrder["Confirmar Pedido (POST /api/orders)"]
    
    SubmitOrder --> TxBegin{"Transacción Atómica ($transaction)"}
    TxBegin -->|Validar Stock| CheckStock{"¿Hay stock suficiente?"}
    
    CheckStock -->|No| Rollback["Rollback: Error 400 'Stock insuficiente'"]
    CheckStock -->|Sí| DeductStock["Descuenta stock inmediatamente (stock = stock - cantidad)"]
    DeductStock --> CreateOrder["Crea registro en Order (Estado: PENDING)"]
    CreateOrder --> TxCommit["Confirma Transacción (Commit)"]
    
    TxCommit --> SellerNotice["Vendedor ve pedido en su panel (/seller)"]
    
    SellerNotice --> Decision{"Acción de las partes"}
    Decision -->|Comprador cancela| CancelOrder["PATCH /orders/:id/cancel"]
    Decision -->|Vendedor rechaza| RejectOrder["PATCH /orders/:id/status (CANCELLED)"]
    Decision -->|Entrega en Campus| DeliverOrder["PATCH /orders/:id/status (DELIVERED)"]
    
    CancelOrder --> Restock["Transacción: Se repone el stock automáticamente en inventario"]
    RejectOrder --> Restock
    Restock --> EndCancelled(["Pedido Cancelado"])
    
    DeliverOrder --> ReviewPrompt["Cliente califica al vendedor (1 a 5 estrellas + reseña)"]
    ReviewPrompt --> EndDelivered(["Pedido Completado con Éxito"])
```

---

### 6. Flujo de Recuperación de Contraseña con Gmail SMTP

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Estudiante
    participant Front as ForgotPasswordPage
    participant Back as Backend (/api/auth)
    participant SMTP as Google Gmail SMTP
    participant DB as Neon PostgreSQL

    Usuario->>Front: Ingresa correo institucional
    Front->>Back: POST /api/auth/forgot-password { email }
    Back->>DB: Verifica existencia de cuenta con ese email
    alt Usuario NO existe
        DB-->>Back: No encontrado
        Back-->>Front: Error 404 (Sugerencia de registro)
    else Usuario Existe
        Back->>Back: Genera código numérico seguro de 6 dígitos
        Back->>DB: Guarda resetToken y resetTokenExpires (15 min)
        Back->>SMTP: Envía correo con plantilla HTML institucional
        SMTP-->>Usuario: Correo recibido con código de 6 dígitos
        Back-->>Front: 200 OK: "Código enviado"
        Front-->>Usuario: Paso 2: Ingresar código y nueva contraseña
    end

    Usuario->>Front: Envía código + nueva clave
    Front->>Back: POST /api/auth/reset-password { email, code, newPassword }
    Back->>DB: Valida código y expiración
    Back->>Back: Cifra nueva contraseña con bcrypt
    Back->>DB: Actualiza password y anula resetToken
    Back-->>Front: 200 OK: "Contraseña actualizada exitosamente"
    Front-->>Usuario: Redirección a Login
```

---

### 7. Visualizador Multi-ángulo 360° y Zoom al Cursor

```mermaid
flowchart LR
    A["Vendedor sube múltiples fotos"] --> B["Vercel Blob Storage CDN"]
    B --> C["Detalle de Producto (ProductDetailPage)"]
    C --> D["Carrusel / Miniaturas Multi-Ángulo 360°"]
    D --> E["Usuario pasa el cursor sobre la foto"]
    E --> F["Detección de Coordenadas del Ratón (X, Y en %)"]
    F --> G["Lupa de Zoom Dinámica con Transform Scale (2.2x)"]
```

---

## 📈 Módulo de Analíticas para Vendedores (BI & Rendimiento)

A través del endpoint `GET /api/orders/seller/analytics`, los vendedores tienen acceso a un conjunto integral de indicadores de rendimiento:

- **Ingresos Totales Entregados (`totalDeliveredRevenue`)**: Suma del valor de pedidos completados en campus.
- **Ingresos Potenciales (`potentialRevenue`)**: Total monetario de pedidos en estado `PENDING` o `CONFIRMED`.
- **Volumen y Conversión**: Total de pedidos, tasa de pedidos entregados (`deliveredRate %`) y valor promedio por orden (`averageOrderValue`).
- **Desglose de Estados**: Conteo de pedidos pendientes, confirmados, entregados y cancelados.
- **Ventas Históricas por Mes**: Agrupación cronológica de los últimos 6 meses (ingresos y cantidad de pedidos).
- **Top 5 Productos más Vendidos**: Listado ordenado por unidades entregadas e ingresos recaudados.
- **Salud del Inventario**: Cantidad de productos disponibles, pausados, agotados y total de existencias en bodega/mochila.
- **Reputación y Reseñas**: Calificación promedio sobre 5.0 y distribución de estrellas recibidas.

---

## 📢 Sistema de Solicitudes Estudiantiles

El módulo `/api/requests` soluciona la búsqueda de productos poco comunes o servicios personalizados:

1. **Publicación Ágil**: Un estudiante describe qué necesita, presupuesto máximo que puede pagar, carrera asociada y campus.
2. **Ofertas Directas**: Los compañeros o vendedores que posean el artículo o brinden el servicio envían una contraoferta con precio exacto, mensaje explicativo y enlace opcional a un producto de su catálogo.
3. **Contacto y Cierre**: Una vez satisfecho el requerimiento, la solicitud puede ser marcada como resuelta (`RESOLVED`) o cerrada (`CLOSED`).

---

## 💬 Compra Rápida y Coordinación vía WhatsApp

Para agilizar transacciones rápidas o consultar disponibilidad inmediata, el backend ofrece los endpoints `/api/products/:id/whatsapp-checkout` y `/api/products/:id/buy-whatsapp`:

- Genera un enlace directo a `https://wa.me/<telefono_vendedor>?text=...` con texto formateado que incluye:
  - Título y precio del producto.
  - Cantidad deseada y total estimado en COP.
  - Nombre del estudiante comprador.
  - Lugar sugerido de entrega en el campus (ej: Biblioteca, Cafetería).
  - Notas o instrucciones adicionales.

---

## 🛠️ Stack Tecnológico y Dependencias

A continuación se detalla el ecosistema técnico completo, versiones principales y su rol de ingeniería en el backend:

### Núcleo de Ejecución y Lenguaje
| Tecnología | Versión | Rol y Justificación Técnica |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS 20 / 22) | Entorno de ejecución asíncrono con motor V8 optimizado para I/O concurrente. |
| **TypeScript** | `^7.0.2` | Superconjunto tipado que proporciona tipado estático, interfaces para entidades del negocio y prevención de bugs en tiempo de compilación. |
| **TSX** | `^4.23.15` | Ejecutor y watcher ultrarrápido basado en esbuild para desarrollo local sin pasos manuales de transpilación previa. |
| **CommonJS** | `type: commonjs` | Formato de módulos estandarizado compatible de manera nativa con Vercel Serverless Functions y el ecosistema Node.js clásico. |

### Framework Web y Middlewares
| Dependencia | Versión | Rol y Justificación Técnica |
| :--- | :--- | :--- |
| **Express** | `^5.3.0` | Framework HTTP central con soporte nativo de promesas en enrutadores, gestión fluida de errores asíncronos y límite de payload configurado en `10mb`. |
| **CORS** | `^2.8.6` | Middleware para configuración de políticas de origen cruzado (`Cross-Origin Resource Sharing`), permitiendo cabeceras `Authorization` y `Content-Type`. |
| **Multer** | `^2.5.0` | Middleware para gestión de peticiones `multipart/form-data`, configurado con `memoryStorage` para procesar archivos directamente en buffer de memoria RAM. |
| **Dotenv** | `^18.0.10` | Inyector de variables de entorno desde archivos locales `.env` hacia `process.env`. |

### Capa de Persistencia y ORM
| Dependencia | Versión | Rol y Justificación Técnica |
| :--- | :--- | :--- |
| **Prisma ORM** | `^6.4.0` | Object-Relational Mapping con esquema declarativo, generación automática de tipos TypeScript y migraciones controladas (`prisma db push`). |
| **@prisma/client** | `^6.4.0` | Cliente tipado con compilación de consultas a nivel de engine nativo en C++ y soporte de transacciones atómicas (`$transaction`). |
| **PostgreSQL** | `15+ (Neon DB)` | Motor de base de datos relacional serverless con escalado a cero, branching de datos y pooling de conexiones integrado (`pgbouncer`). |

### Seguridad, Validación y Servicios Cloud
| Dependencia | Versión | Rol y Justificación Técnica |
| :--- | :--- | :--- |
| **Zod** | `^3.25.76` | Biblioteca de validación de esquemas y análisis de datos en tiempo de ejecución con inferencia estática de tipos (`z.infer<T>`). |
| **jsonwebtoken (JWT)** | `^9.0.3` | Generación y verificación criptográfica de tokens portadores (Bearer) con firma HMAC-SHA256 y expiración configurable (`7d`). |
| **bcryptjs** | `^3.0.3` | Implementación de hash seguro para contraseñas con generación de sal aleatoria (`genSalt(10)`). |
| **@vercel/blob** | `^2.9.0` | SDK oficial de Vercel Blob Storage para carga y entrega de recursos multimedia en una red global de distribución CDN. |
| **Nodemailer** | `^10.5.0` | Cliente de transporte SMTP configurado sobre protocolo seguro (puerto 465 SSL) conectado a Google Gmail. |

---

## 🏛️ Arquitectura de Software y Decisiones Técnicas

### Patrón en Capas (Layered Architecture)
El backend sigue rigurosamente el patrón de capas desacopladas para garantizar alta cohesión y bajo acoplamiento:

```
[ Petición HTTP ]
       │
       ▼
[ Middlewares: Auth (JWT) / RBAC / Multer / Validation ]
       │
       ▼
[ Router: Define endpoints y rutas REST ]
       │
       ▼
[ Controller: Extrae req.body / req.params / req.query y responde JSON ]
       │
       ▼
[ Service: Contiene la lógica de negocio, validaciones y reglas ]
       │
       ▼
[ Data Layer: Prisma ORM Client & Modelos ]
       │
       ▼
[ PostgreSQL (Neon DB Serverless) ]
```

### Validación Estricta con Zod y Manejo Centralizado de Excepciones
1. **Validación Declarativa**: Todas las entradas (`body`, `query`) se validan contra esquemas de Zod antes de ingresar a los servicios (`requests.schema.ts`, `products.schema.ts`, `auth.schema.ts`).
2. **Clase Personalizada `AppError`**: Representa errores operacionales del negocio acompañados de su código HTTP respectivo (400, 401, 403, 404, 409).
3. **Manejador Global (`errorHandler`)**:
   - Detecta `ZodError` y devuelve una lista normalizada de campos y mensajes amigables con HTTP 400.
   - Detecta códigos de error nativos de Prisma (ej: `P2002` por violación de unicidad con HTTP 409; `P2025` por registro no encontrado con HTTP 404).
   - Oculta trazas sensibles en producción ante errores no controlados (HTTP 500).

### Estrategia de Base de Datos: Connection Pooling y Direct URL
La conexión a Neon PostgreSQL se encuentra optimizada mediante una estrategia de doble URL:
- `DATABASE_URL`: Apunta al pooler transaccional (`pgbouncer`) con parámetros `sslmode=require&connect_timeout=30&pool_timeout=30`, ideal para entornos serverless con aperturas y cierres masivos de instancias.
- `DIRECT_URL`: Conexión TCP directa hacia el nodo primario de PostgreSQL, requerida por Prisma para ejecutar operaciones DDL (`prisma db push`, migraciones y bloqueos a nivel de tabla).

### Patrón Singleton para Prisma Client
Para prevenir el agotamiento de sockets de base de datos debido al recargado en caliente de `tsx` en desarrollo o el ciclo de vida efímero de funciones en la nube, la instancia de `PrismaClient` se aloja en `globalThis`:

```typescript
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

globalForPrisma.prisma = prisma;
```

### Transacciones Atómicas ACID y Prevención de Race Conditions
Las operaciones donde intervienen cambios de inventario o integridad referencial se procesan de forma estricta mediante `prisma.$transaction`:
- **Creación de Pedidos**: Verifica la disponibilidad física del stock y lo descuenta en un único paso atómico. Si dos compras intentan consumir la última unidad simultáneamente, la segunda falla limpiamente por falta de inventario sin generar estados inconsistentes.
- **Cancelaciones**: Si el cliente cancela o el vendedor rechaza la orden, el stock de cada producto involucrado se restituye dentro de la misma transacción.
- **Eliminación Segura de Productos**: Antes de borrar un producto, la transacción elimina reseñas huérfanas e items asociados, garantizando que ninguna llave foránea bloquee la operación.

### Gestión de Multimedia en Memoria con Vercel Blob
En arquitecturas serverless como Vercel, el sistema de archivos local (`/tmp`) es efímero y no persistente. Por ello:
- Multer procesa las imágenes directamente en un buffer de memoria RAM (`memoryStorage()`).
- Se validan tipos MIME autorizados (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`) con tope de 5 MB por archivo.
- Los buffers se transfieren de forma directa a Vercel Blob Storage mediante `@vercel/blob`, obteniendo URLs públicas servidas desde CDN perimetral.

### Seguridad Criptográfica y Autenticación RBAC
- **Hashing de Contraseñas**: Se aplica `bcryptjs` con 10 rondas de sal. Los hashes jamás se incluyen en las proyecciones `select` de los servicios hacia el cliente.
- **Tokens de Sesión**: JWT firmado con HMAC-SHA256 que encapsula `{ id, email, role, name }`.
- **Module Augmentation en Express**: Se extiende la interfaz `Express.Request` de TypeScript para tipar de forma nativa la propiedad `req.user: AuthenticatedUser`.
- **RBAC Granular**: El middleware `authorizeRole(Role.CLIENTE)` o `authorizeRole(Role.VENDEDOR)` restringe los endpoints exclusivos de cada perfil.

### Pipeline de Scripts NPM y Automatización
| Comando | Función Técnica |
| :--- | :--- |
| `npm run dev` | Ejecuta el servidor en modo desarrollo mediante `tsx watch src/server.ts`. |
| `npm run build` | Compila el cliente de Prisma (`prisma generate`) y transpila TypeScript a JavaScript (`tsc`). |
| `npm run postinstall` | Hook ejecutado automáticamente por plataformas como Vercel o Docker al instalar dependencias (`prisma generate`). |
| `npm run start` | Arranca la aplicación compilada en producción mediante `node dist/server.js`. |
| `npm run seed` | Ejecuta el script declarativo de poblamiento `prisma/seed.ts`. |
| `npm run prisma:push` | Sincroniza el esquema relacional `schema.prisma` con la base de datos sin generar archivos de migración manuales. |
| `npm run prisma:studio` | Abre una interfaz gráfica interactiva en el navegador para explorar y modificar registros. |
| `npm run prisma:generate` | Regenera los tipos y clientes de Prisma tras cambios en el modelo. |

---

## 📁 Estructura del Repositorio

```text
e-commerce-universitary-backend/
├── api/
│   └── index.ts                   # Entrypoint Serverless para Vercel
├── prisma/
│   ├── schema.prisma              # Definición de modelos, enums y relaciones
│   └── seed.ts                    # Seeder de Categorías universitarias de Cereté
├── src/
│   ├── config/
│   │   ├── env.ts                 # Variables de entorno validadas
│   │   └── prisma.ts              # Cliente Singleton de Prisma
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # Verificación de JWT y autenticación opcional
│   │   ├── role.middleware.ts     # Control de acceso basado en roles (RBAC)
│   │   ├── error.middleware.ts    # Manejador global centralizado de excepciones
│   │   └── upload.middleware.ts   # Multer en memoria para subida de archivos
│   ├── modules/
│   │   ├── auth/                  # Registro, Login, Switch Role, Forgot/Reset Password
│   │   ├── categories/            # Consulta y auto-seeding de categorías
│   │   ├── orders/                # Pedidos, checkout, cancelaciones, reseñas y analytics
│   │   ├── products/              # Catálogo, CRUD, filtros, soft-states y WhatsApp link
│   │   ├── requests/              # Solicitudes de estudiantes y ofertas de vendedores
│   │   ├── uploads/               # Conector con Vercel Blob Storage
│   │   └── users/                 # Perfil propio y fichas públicas de vendedores
│   ├── routes/
│   │   └── index.ts               # Enrutador centralizado de la API (/api)
│   ├── services/
│   │   └── mail.service.ts        # Transporter SMTP Gmail y plantillas de correo
│   ├── app.ts                     # Configuración de Express, CORS y parseadores
│   └── server.ts                  # Arranque del servidor local y auto-seeding
├── vercel.json                    # Configuración de compilación y ruteo para Vercel
├── package.json
└── tsconfig.json
```

---

## ⚙️ Guía de Configuración, Instalación y Despliegue

### Requisitos Previos
- **Node.js**: Versión 18 o superior (recomendado Node 20 LTS o 22).
- **npm** o **pnpm**.
- Una base de datos PostgreSQL activa (Neon DB o local).

---

### Variables de Entorno Backend (`.env`)

Crea un archivo `.env` en la raíz del proyecto backend:

```env
# Puerto del servidor local
PORT=4000

# Conexión a Base de Datos (Neon PostgreSQL Serverless)
DATABASE_URL="postgresql://usuario:password@ep-hidden-bird.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30"
DIRECT_URL="postgresql://usuario:password@ep-hidden-bird.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30"

# Token de Vercel Blob Storage para carga de imágenes
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# Configuración JWT
JWT_SECRET="super_secret_university_ecommerce_jwt_key_2025"
JWT_EXPIRES_IN="7d"

# Configuración Gmail SMTP para recuperación de contraseñas
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="tu_correo_gmail@gmail.com"
SMTP_PASS="tu_contraseña_de_aplicacion_de_16_letras"
SMTP_FROM="CampusMarket <soporte@campusmarket.edu.co>"
```

> [!NOTE]
> Para obtener la `SMTP_PASS`, ingresa a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), activa la verificación en dos pasos y genera una contraseña de aplicación para `CampusMarket`.

---

### Variables de Entorno Frontend (`.env`)

En el repositorio cliente `e-commerce-universitary-frontend`:

```env
VITE_API_URL="http://localhost:4000/api"
```

---

### Comandos de Puesta en Marcha Local

```bash
cd e-commerce-universitary-backend

# 1. Instalar dependencias
npm install

# 2. Sincronizar modelos con la base de datos
npm run prisma:push

# 3. Poblar categorías universitarias iniciales
npm run seed

# 4. Iniciar en modo desarrollo con recarga en caliente
npm run dev
```

El servidor estará escuchando en `http://localhost:4000`.

---

### Despliegue Serverless en Vercel

El proyecto está preconfigurado para compilarse y ejecutarse en Vercel sin configuraciones manuales complejas:

1. El archivo `vercel.json` rutea todas las solicitudes hacia `api/index.ts`.
2. El script de compilación `build` genera el cliente Prisma (`prisma generate`) y compila TypeScript (`tsc`).
3. El hook `postinstall` ejecuta `prisma generate` automáticamente durante el despliegue.
4. Las categorías universitarias se auto-poblarán de manera transparente ante la primera consulta si la base de datos está vacía.

Para desplegar con Vercel CLI:
```bash
vercel
```
O conecta tu repositorio en el panel web de Vercel configurando las variables de entorno especificadas en el archivo `.env`.

---

## 📡 Referencia Completa de la API RESTful

Todas las rutas responden en formato JSON y tienen como prefijo base `/api`.

### 0. Endpoints Base y Salud
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Público | Información de bienvenida, estado y versión de la API. |
| `GET` | `/health` | Público | Endpoint de verificación de salud (*healthcheck*). |

---

### 1. Autenticación y Cuentas (`/api/auth`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Público | Registra una cuenta estudiantil única (CLIENTE o VENDEDOR). |
| `POST` | `/auth/login` | Público | Inicia sesión y retorna JWT + datos de usuario. |
| `POST` | `/auth/switch-role` | Autenticado | Alterna entre modalidad Comprador y Vendedor emitiendo un nuevo JWT. |
| `POST` | `/auth/forgot-password` | Público | Genera y envía código de verificación de 6 dígitos por Gmail. |
| `POST` | `/auth/reset-password` | Público | Valida código numérico y actualiza la contraseña de forma segura. |
| `GET` | `/auth/profile` | Autenticado | Obtiene el perfil del usuario autenticado con conteo de métricas. |

---

### 2. Productos y Catálogo (`/api/products`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Público | Catálogo con filtros (`search`, `categoryId`, `condition`, precios, paginación). |
| `GET` | `/products/:id` | Público | Ficha detallada del producto, vendedor y fotos multi-ángulo. |
| `GET` | `/products/detail/:id` | Público | Alias para obtener detalle del producto por ID. |
| `GET / POST` | `/products/:id/whatsapp-checkout` | Público / Autenticado | Genera enlace preformateado de WhatsApp para coordinar compra directa. |
| `GET / POST` | `/products/:id/buy-whatsapp` | Público / Autenticado | Alias para checkout por WhatsApp. |
| `POST` | `/products` | Rol VENDEDOR | Publica un nuevo producto con fotos, stock y punto de encuentro. |
| `GET` | `/products/my/products` | Rol VENDEDOR | Lista los productos publicados por el vendedor actual. |
| `PUT` | `/products/:id` | Rol VENDEDOR | Modifica título, precio, descripción, stock, condición o estado. |
| `DELETE` | `/products/:id` | Rol VENDEDOR | Elimina un producto propio de forma segura en transacción atómica. |

---

### 3. Solicitudes Estudiantiles y Ofertas (`/api/requests`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/requests` | Público | Lista solicitudes con filtros (`status`, `career`, `search`, paginación). |
| `GET` | `/requests/detail/:id` | Público | Detalle de la solicitud, autor y ofertas recibidas de vendedores. |
| `GET` | `/requests/my/list` | Autenticado | Lista las solicitudes creadas por el usuario autenticado. |
| `POST` | `/requests` | Autenticado | Publica un requerimiento con presupuesto máximo, carrera y campus. |
| `PATCH` | `/requests/:id/status` | Autenticado (Autor) | Actualiza el estado de la solicitud (`OPEN`, `RESOLVED`, `CLOSED`). |
| `DELETE` | `/requests/:id` | Autenticado (Autor) | Elimina una solicitud propia y sus ofertas en cascada. |
| `POST` | `/requests/:id/offers` | Autenticado | Realiza una oferta o cotización (mensaje, precio COP y producto opcional). |
| `DELETE` | `/requests/offers/:offerId` | Autenticado (Vendedor) | Elimina una oferta propia enviada previamente. |

---

### 4. Pedidos y Analíticas (`/api/orders`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Rol CLIENTE | Crea orden de compra con descuento atómico de stock. |
| `GET` | `/orders/my/purchases` | Rol CLIENTE | Historial de pedidos realizados por el comprador. |
| `GET` | `/orders/buyer/orders` | Rol CLIENTE | Alias del historial de compras del cliente. |
| `PATCH` | `/orders/:id/cancel` | Rol CLIENTE | Cancela pedido pendiente y repone el stock automáticamente. |
| `POST` | `/orders/reviews` | Rol CLIENTE | Deja calificación (1 a 5 estrellas) y reseña al vendedor. |
| `GET` | `/orders/seller/analytics` | Rol VENDEDOR | **Métricas y BI**: Ingresos, tasa de entrega, ventas históricas y stock. |
| `GET` | `/orders/my/sales` | Rol VENDEDOR | Lista de pedidos recibidos por el vendedor para entrega. |
| `GET` | `/orders/seller` | Rol VENDEDOR | Alias de pedidos del vendedor. |
| `GET` | `/orders/seller/orders` | Rol VENDEDOR | Alias de pedidos del vendedor. |
| `PATCH` | `/orders/:id/status` | Rol VENDEDOR | Actualiza estado a `CONFIRMED`, `DELIVERED` o `CANCELLED` (con reposición). |
| `GET` | `/orders/:id` | Autenticado | Detalle completo del pedido (solo para comprador o vendedor involucrado). |

---

### 5. Categorías (`/api/categories`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Público | Lista categorías con conteo de productos (con auto-seeding on-demand). |
| `GET` | `/categories/:id` | Público | Detalle de la categoría y sus productos disponibles. |
| `POST` | `/categories` | Rol VENDEDOR | Crea una nueva categoría universitaria con slug autogenerado. |

---

### 6. Usuarios y Perfiles (`/api/users`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/sellers/:id` | Público | Perfil público de un vendedor, productos activos y calificaciones. |
| `PUT` | `/users/profile` | Autenticado | Actualiza datos del perfil propio (nombre, teléfono, WhatsApp, carrera, avatar). |

---

### 7. Carga de Archivos (`/api/upload`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/upload/single` | Autenticado | Sube 1 imagen a Vercel Blob Storage y retorna URL pública CDN. |
| `POST` | `/upload/multiple` | Autenticado | Sube hasta 5 imágenes simultáneas (ideal para visor multi-ángulo 360°). |

---

## 🔒 Seguridad, Reglas de Negocio e Integridad

1. **Unicidad de Identidad Estudiantil (`@unique email`)**:
   - Cada estudiante posee una única cuenta centralizada. El cambio de rol es dinámico, evitando duplicación de registros y desincronización de pedidos o historiales.
2. **Integridad Transaccional ACID**:
   - Tanto la creación de pedidos como la cancelación de órdenes y la eliminación segura de productos operan dentro de bloques `$transaction` de Prisma, eliminando cualquier riesgo de condiciones de carrera (*race conditions*).
3. **Expiración Estricta de Tokens y Códigos OTP**:
   - Los tokens JWT poseen expiración configurable (por defecto 7 días).
   - Los códigos numéricos de recuperación de contraseña caducan en **15 minutos exactos** y se invalidan inmediatamente tras su uso.
4. **Protección de Contraseñas y Datos Sensibles**:
   - Las contraseñas se procesan con salt rounds de `bcryptjs`. Los payloads de respuesta omiten sistemáticamente los hashes de contraseñas.
5. **Control de Acceso Basado en Roles (RBAC)**:
   - Middlewares dedicados (`authenticate` y `authorizeRole`) garantizan que únicamente vendedores puedan gestionar productos o consultar analíticas financieras, y que solo compradores creen pedidos o publiquen reseñas.

---

## 🏛️ Créditos Institucionales

- **Proyecto**: E-Commerce Universitario — CampusMarket
- **Institución**: Universidad de Cartagena
- **Campus**: Centro Tutorial Cereté
- **Propósito**: Facilitar el comercio ético, seguro y colaborativo dentro de la comunidad universitaria.
