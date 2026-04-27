document.addEventListener('DOMContentLoaded', function() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const welcomeVideo = document.getElementById('welcomeVideo');
    
    // Variable para controlar si el video ya terminó
    let videoEnded = false;
    
    // Intentar reproducir con sonido
    const playVideoWithSound = async () => {
        try {
            // Intentar reproducir con audio
            await welcomeVideo.play();
            
            // Si llegamos aquí, el audio se está reproduciendo
            console.log('Video reproduciéndose con audio');
            
            // Configurar eventos del video
            setupVideoEvents();
            
        } catch (error) {
            console.log('No se pudo reproducir con audio automáticamente:', error);
            
            // Intentar reproducir sin audio (muted) como fallback
            welcomeVideo.muted = true;
            await welcomeVideo.play();
            
            // Configurar eventos del video
            setupVideoEvents();
        }
    };
    
    // Función para configurar eventos del video
    function setupVideoEvents() {
        // Evento cuando el video termina
        welcomeVideo.addEventListener('ended', function() {
            if (!videoEnded) {
                videoEnded = true;
                redirectToLogin();
            }
        });
        
        // Si el video no se carga o tiene error, redirigir después de 3 segundos
        welcomeVideo.addEventListener('error', function() {
            console.log('Error cargando el video, redirigiendo a login');
            setTimeout(() => {
                if (!videoEnded) {
                    videoEnded = true;
                    redirectToLogin();
                }
            }, 3000);
        });
        
        // También un timeout de respaldo por si acaso (5 segundos)
        setTimeout(() => {
            if (!videoEnded) {
                videoEnded = true;
                redirectToLogin();
            }
        }, 5000);
    }
    
    // Función para redirigir a login.html
    function redirectToLogin() {
        // Aplicar animación de fade out
        welcomeScreen.classList.add('fade-out');
        
        // Esperar a que termine la animación y redirigir
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000); // Tiempo igual a la duración de la animación CSS
    }
    
    // Intentar reproducir el video con sonido
    playVideoWithSound();
    
    // Permitir saltar el video con clic
    welcomeScreen.addEventListener('click', function() {
        if (!videoEnded) {
            videoEnded = true;
            welcomeVideo.pause();
            redirectToLogin();
        }
    });
    
    // Permitir saltar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !videoEnded) {
            videoEnded = true;
            welcomeVideo.pause();
            redirectToLogin();
        }
    });
    
    // Permitir saltar con tecla Enter o Espacio
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'Enter' || e.key === ' ') && !videoEnded) {
            videoEnded = true;
            welcomeVideo.pause();
            redirectToLogin();
        }
    });
});