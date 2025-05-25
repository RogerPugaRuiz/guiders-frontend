const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('cypress/fixtures/mock-server-db.json');
const middlewares = jsonServer.defaults();

// Middleware personalizado para logging
server.use((req, res, next) => {
  console.log(`[MOCK SERVER] ${req.method} ${req.url}`);
  next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Ruta personalizada para login exitoso
server.post('/user/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log(`[MOCK SERVER] Login attempt: ${email}`);
  
  // Simular diferentes respuestas según las credenciales
  if (email === 'wrong@email.com' && password === 'wrongpassword') {
    // Error 401 - Credenciales incorrectas
    return res.status(401).json({
      success: false,
      message: 'El email o la contraseña no son correctos'
    });
  }
  
  if (email === 'server@error.com') {
    // Error 500 - Error del servidor
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
  
  if (email === 'network@error.com') {
    // Simular error de red (no responder)
    return; // No enviar respuesta
  }
  
  // Login exitoso por defecto
  res.status(200).json({
    success: true,
    session: {
      token: 'mock-jwt-token-12345',
      refreshToken: 'mock-refresh-token-67890',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'test-user-id-123',
        email: email,
        name: 'Usuario de Prueba Mock',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  });
});

// Ruta para verificar autenticación
server.get('/user/auth/verify', (req, res) => {
  const token = req.headers.authorization;
  
  if (!token || !token.includes('mock-jwt-token')) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
  
  res.status(200).json({
    success: true,
    user: {
      id: 'test-user-id-123',
      email: 'test@guiders.com',
      name: 'Usuario de Prueba Mock',
      role: 'user',
      isActive: true
    }
  });
});

// Ruta para logout
server.post('/user/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

// Usar el router por defecto para otras rutas
server.use(router);

const PORT = process.env.MOCK_SERVER_PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Mock Server running on http://localhost:${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   POST /user/auth/login`);
  console.log(`   GET  /user/auth/verify`);
  console.log(`   POST /user/auth/logout`);
});
