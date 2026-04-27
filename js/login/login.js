// js/login/login.js
document.addEventListener('DOMContentLoaded', function() {
    // ========== ELEMENTOS DEL DOM ==========
    const loginForm = document.getElementById('loginForm');
    const areaSelect = document.getElementById('area');
    const userTypeSelect = document.getElementById('userType');
    const workerCodeInput = document.getElementById('workerCode');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const loginBtn = document.getElementById('loginBtn');
    const nominaLoading = document.getElementById('nominaLoading');

    // ========== VARIABLES GLOBALES ==========
    let usuarioData = null;
    let buscaTimeout = null;
    let esUsuarioEspecial = false; // Variable para identificar si es el usuario especial

    // ========== INICIALIZACIÓN ==========
    setupPasswordToggle();
    setupNominaSearch();

    // ========== FUNCIÓN: Configurar toggle de contraseña ==========
    function setupPasswordToggle() {
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const passwordInput = this.closest('.input-with-icon').querySelector('input');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.classList.remove('fa-eye');
                    this.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    this.classList.remove('fa-eye-slash');
                    this.classList.add('fa-eye');
                }
            });
        });
    }

    // ========== FUNCIÓN: Cargar áreas y roles para selects manuales ==========
    async function cargarAreasYRoles() {
        try {
            const response = await fetch('php/login/get_areas_roles.php');
            const data = await response.json();
            
            if (data.success) {
                return { areas: data.areas, roles: data.roles };
            } else {
                console.error('Error al cargar áreas y roles');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    // ========== FUNCIÓN: Configurar selects manuales (editables) ==========
    async function configurarSelectsManuales(usuario) {
        // Cargar áreas y roles desde la base de datos
        const datos = await cargarAreasYRoles();
        
        if (datos) {
            // Limpiar selects
            areaSelect.innerHTML = '';
            userTypeSelect.innerHTML = '';
            
            // Llenar select de áreas
            datos.areas.forEach(area => {
                const option = document.createElement('option');
                option.value = area.id;
                option.textContent = area.area;
                if (area.id == usuario.area_id) {
                    option.selected = true;
                }
                areaSelect.appendChild(option);
            });
            
            // Llenar select de roles
            datos.roles.forEach(rol => {
                const option = document.createElement('option');
                option.value = rol.id;
                option.textContent = rol.rol;
                if (rol.id == usuario.rol_id) {
                    option.selected = true;
                }
                userTypeSelect.appendChild(option);
            });
            
            // Habilitar los selects para que sean editables
            areaSelect.disabled = false;
            userTypeSelect.disabled = false;
        } else {
            // Fallback: mostrar solo la opción del usuario
            areaSelect.innerHTML = '';
            userTypeSelect.innerHTML = '';
            
            const areaOption = document.createElement('option');
            areaOption.value = usuario.area_id;
            areaOption.textContent = usuario.area_nombre;
            areaOption.selected = true;
            areaSelect.appendChild(areaOption);
            
            const rolOption = document.createElement('option');
            rolOption.value = usuario.rol_id;
            rolOption.textContent = usuario.rol_nombre;
            rolOption.selected = true;
            userTypeSelect.appendChild(rolOption);
            
            // Habilitar los selects
            areaSelect.disabled = false;
            userTypeSelect.disabled = false;
        }
    }

    // ========== FUNCIÓN: Configurar selects automáticos (no editables) ==========
    function configurarSelectsAutomaticos(usuario) {
        // Limpiar selects
        areaSelect.innerHTML = '';
        userTypeSelect.innerHTML = '';
        
        // Agregar opción con la información del usuario
        const areaOption = document.createElement('option');
        areaOption.value = usuario.area_id;
        areaOption.textContent = usuario.area_nombre;
        areaOption.selected = true;
        areaSelect.appendChild(areaOption);
        
        const rolOption = document.createElement('option');
        rolOption.value = usuario.rol_id;
        rolOption.textContent = usuario.rol_nombre;
        rolOption.selected = true;
        userTypeSelect.appendChild(rolOption);
        
        // Deshabilitar los selects (no se pueden cambiar)
        areaSelect.disabled = true;
        userTypeSelect.disabled = true;
    }

    // ========== FUNCIÓN: Búsqueda automática de nómina ==========
    function setupNominaSearch() {
        workerCodeInput.addEventListener('input', function() {
            // Limpiar timeout anterior
            if (buscaTimeout) {
                clearTimeout(buscaTimeout);
            }
            
            // Obtener valor
            let valor = this.value.trim();
            
            // Validar solo números
            this.value = valor.replace(/[^0-9]/g, '');
            valor = this.value;
            
            // Limpiar errores
            clearFieldError('errorWorkerCode');
            
            // Si el campo está vacío, resetear todo
            if (valor === '') {
                resetFormAfterNomina();
                return;
            }
            
            // Si tiene al menos 4 dígitos, buscar
            if (valor.length >= 4) {
                // Mostrar indicador de carga
                nominaLoading.style.display = 'inline-block';
                
                // Buscar después de 500ms (para no saturar)
                buscaTimeout = setTimeout(() => {
                    buscarUsuarioPorNomina(valor);
                }, 500);
            } else {
                resetFormAfterNomina();
            }
        });
    }
    
    // ========== FUNCIÓN: Buscar usuario por nómina ==========
    async function buscarUsuarioPorNomina(no_nomina) {
        try {
            const response = await fetch(`php/login/get_usuario.php?nomina=${encodeURIComponent(no_nomina)}`);
            const data = await response.json();
            
            nominaLoading.style.display = 'none';
            
            if (data.success) {
                // Usuario encontrado
                usuarioData = data.usuario;
                
                // Verificar si es el usuario especial: área "innovacion_tecnologica" y rol "representante"
                const areaEspecial = usuarioData.area_nombre && usuarioData.area_nombre.toUpperCase() === 'INNOVACION_TECNOLOGICA';
                const rolEspecial = usuarioData.rol_nombre && usuarioData.rol_nombre.toUpperCase() === 'REPRESENTANTE';
                esUsuarioEspecial = areaEspecial && rolEspecial;
                
                if (esUsuarioEspecial) {
                    // Usuario especial: habilitar selects manuales
                    await configurarSelectsManuales(usuarioData);
                } else {
                    // Usuario normal: autocompletar área y rol (no editables)
                    configurarSelectsAutomaticos(usuarioData);
                }
                
                // Habilitar campo de contraseña
                passwordInput.disabled = false;
                
                // Limpiar error de contraseña si existe
                clearFieldError('errorPassword');
                
                // Habilitar botón de login
                loginBtn.disabled = false;
                
                // Enfocar en contraseña
                setTimeout(() => {
                    passwordInput.focus();
                }, 100);
                
            } else {
                // Usuario no encontrado
                showError('errorWorkerCode', data.message || 'Nómina no registrada');
                resetFormAfterNomina();
                usuarioData = null;
                esUsuarioEspecial = false;
            }
            
        } catch (error) {
            console.error('Error al buscar usuario:', error);
            nominaLoading.style.display = 'none';
            showError('errorWorkerCode', 'Error de conexión con el servidor');
            resetFormAfterNomina();
            usuarioData = null;
            esUsuarioEspecial = false;
        }
    }
    
    // ========== FUNCIÓN: Resetear formulario cuando no hay nómina ==========
    function resetFormAfterNomina() {
        // Resetear datos
        usuarioData = null;
        esUsuarioEspecial = false;
        
        // Limpiar selects
        areaSelect.innerHTML = '<option value="">Ingrese primero su nómina</option>';
        userTypeSelect.innerHTML = '<option value="">Ingrese primero su nómina</option>';
        
        // Deshabilitar campos
        areaSelect.disabled = true;
        userTypeSelect.disabled = true;
        passwordInput.disabled = true;
        loginBtn.disabled = true;
        
        // Limpiar campos
        passwordInput.value = '';
        
        // Limpiar errores
        clearFieldError('errorArea');
        clearFieldError('errorUserType');
        clearFieldError('errorPassword');
    }
    
    // ========== FUNCIÓN: Reproducir audio de bienvenida con indicador ==========
    function reproducirBienvenidaConIndicador(usuario, callback) {
        // Crear overlay con indicador de carga circular
        const overlay = document.createElement('div');
        overlay.className = 'audio-loading-overlay';
        overlay.innerHTML = `
            <div class="audio-loading-container">
                <div class="audio-spinner"></div>
                <div class="audio-text">Bienvenido ${usuario.nombre}</div>
                <div class="audio-subtext">Cargando Interfaz...</div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Crear elemento de audio
        const audio = new Audio('audios/bienvenido.mp3');
        
        // Configurar eventos del audio
        audio.addEventListener('canplaythrough', function() {
            console.log('✅ Audio cargado correctamente');
        });
        
        audio.addEventListener('play', function() {
            console.log('🔊 Reproduciendo audio de bienvenida');
        });
        
        audio.addEventListener('ended', function() {
            console.log('✅ Audio finalizado');
            // Eliminar el overlay
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
            // Ejecutar callback
            if (callback) callback();
        });
        
        audio.addEventListener('error', function(e) {
            console.error('❌ Error al reproducir audio:', e);
            // Eliminar el overlay
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
            // Si hay error, igual ejecutar callback
            if (callback) callback();
        });
        
        // Intentar reproducir
        audio.play().catch(function(error) {
            console.error('❌ Error al reproducir audio:', error);
            // Eliminar el overlay
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
            // Ejecutar callback aunque haya error
            if (callback) callback();
        });
    }
    
    // ========== EVENTO: Envío del formulario ==========
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar que tengamos datos del usuario
        if (!usuarioData) {
            showError('errorWorkerCode', 'Primero ingrese una nómina válida');
            workerCodeInput.focus();
            return;
        }
        
        // Validar contraseña
        if (!passwordInput.value.trim()) {
            showError('errorPassword', 'Ingrese su contraseña');
            passwordInput.focus();
            return;
        }
        
        // Validar que área y rol estén seleccionados (para usuario especial)
        if (esUsuarioEspecial) {
            if (!areaSelect.value || !userTypeSelect.value) {
                showError('errorArea', 'Seleccione un área');
                showError('errorUserType', 'Seleccione un rol');
                return;
            }
        }
        
        // Deshabilitar botón y mostrar carga
        setLoginButtonLoading(true);
        
        try {
            // Preparar datos para login
            const loginData = {
                no_nomina: workerCodeInput.value.trim(),
                password: passwordInput.value.trim(),
                area_id: parseInt(areaSelect.value),
                rol_id: parseInt(userTypeSelect.value)
            };
            
            console.log('📤 Enviando datos:', loginData);
            
            // Enviar petición de login
            const response = await fetch('php/login/login.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            console.log('📥 Datos recibidos:', data);
            
            if (data.success) {
                if (data.es_primer_inicio) {
                    // Primer inicio: mostrar modal de cambio de contraseña
                    showChangePasswordModal(data.usuario, async function(success) {
                        if (success) {
                            // Reproducir audio y redirigir después del cambio exitoso
                            reproducirBienvenidaConIndicador(data.usuario, function() {
                                // Guardar datos en localStorage
                                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                                localStorage.setItem('token', data.token);
                                localStorage.setItem('login_timestamp', Date.now().toString());
                                redirectUser(data.usuario);
                            });
                        } else {
                            setLoginButtonLoading(false);
                        }
                    });
                } else {
                    // No es primer inicio: guardar datos, reproducir audio y redirigir
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('login_timestamp', Date.now().toString());
                    
                    reproducirBienvenidaConIndicador(data.usuario, function() {
                        redirectUser(data.usuario);
                    });
                }
            } else {
                // Mostrar error
                showError('errorPassword', data.message || 'Credenciales incorrectas');
                setLoginButtonLoading(false);
                passwordInput.focus();
                
                // Animación de error
                loginForm.classList.add('shake');
                setTimeout(() => loginForm.classList.remove('shake'), 500);
            }
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            showError('errorPassword', 'Error de conexión con el servidor');
            setLoginButtonLoading(false);
        }
    });
    
    // ========== FUNCIÓN: Redirigir según el área ==========
    function redirectUser(usuario) {
        // Efecto de transición
        document.body.style.opacity = '0.5';
        document.body.style.transform = 'scale(0.95)';
        document.body.style.transition = 'all 0.5s ease';
        
        // Obtener valores del área y rol REALES del usuario
        const areaReal = (usuario.area_nombre || '').toString().trim().toUpperCase();
        const rolReal = (usuario.rol_nombre || '').toString().trim().toUpperCase();
        
        console.log('🔍 Área REAL:', areaReal);
        console.log('🔍 Rol REAL:', rolReal);
        
        let urlDestino = '';
        
        // Redirigir según el área y rol REALES
        if (areaReal === 'DIRECCION_GENERAL') {
            urlDestino = 'interfaces_areas/direccion_general/direccion_general.html';
            console.log('✅ Redirigiendo a Dirección General');
        }
        else if (areaReal === 'INNOVACION_TECNOLOGICA') {
            if (rolReal === 'REPRESENTANTE') {
                urlDestino = 'interfaces_areas/innovacion_tecnologica/representante/representante.html';
                console.log('✅ Redirigiendo a Innovación - Representante');
            } else {
                urlDestino = 'interfaces_areas/innovacion_tecnologica/colaboradores/colaboradores.html';
                console.log('✅ Redirigiendo a Innovación - Colaborador');
            }
        }
        else if (areaReal === 'ATENCION_A_USUARIOS') {
            if (rolReal === 'REPRESENTANTE') {
                urlDestino = 'interfaces_areas/atencion_a_usuarios/representante/representante.html';
                console.log('✅ Redirigiendo a Atención - Representante');
            } else {
                urlDestino = 'interfaces_areas/atencion_a_usuarios/colaboradores/colaboradores.html';
                console.log('✅ Redirigiendo a Atención - Colaborador');
            }
        }
        else {
            console.error('❌ Área no reconocida:', areaReal);
            
            // Mostrar error y no redirigir
            Swal.fire({
                icon: 'error',
                title: 'Error de redirección',
                text: `Área no reconocida: ${areaReal}`,
                confirmButtonColor: '#691a30'
            });
            
            document.body.style.opacity = '1';
            document.body.style.transform = 'scale(1)';
            return;
        }
        
        console.log('🔄 Redirigiendo a:', urlDestino);
        
        setTimeout(() => {
            window.location.href = urlDestino;
        }, 500);
    }
    
    // ========== FUNCIÓN: Mostrar modal de cambio de contraseña ==========
    function showChangePasswordModal(userData, callback) {
        // Crear el modal
        const modal = document.createElement('div');
        modal.className = 'change-password-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>
                    <i class="fas fa-key"></i>
                    CAMBIAR CONTRASEÑA
                </h2>
                
                <div class="password-grid">
                    <div class="form-group">
                        <label>
                            <i class="fas fa-lock"></i>
                            NUEVA CONTRASEÑA
                        </label>
                        <div class="input-with-icon">
                            <i class="fas fa-key"></i>
                            <input type="password" 
                                   id="newPassword" 
                                   placeholder="INGRESE NUEVA CONTRASEÑA">
                            <i class="fas fa-eye toggle-new-password"></i>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <i class="fas fa-check-circle"></i>
                            CONFIRMAR CONTRASEÑA
                        </label>
                        <div class="input-with-icon">
                            <i class="fas fa-lock"></i>
                            <input type="password" 
                                   id="confirmPassword" 
                                   placeholder="CONFIRME LA CONTRASEÑA">
                            <i class="fas fa-eye toggle-confirm-password"></i>
                        </div>
                    </div>
                </div>
                
                <div class="validation-rules">
                    <p>
                        <i class="fas fa-shield-alt"></i>
                        LA CONTRASEÑA DEBE CUMPLIR:
                    </p>
                    
                    <div class="rules-grid">
                        <div id="rule-length" class="rule-item">
                            <i class="fas fa-circle"></i>
                            <span>MÍNIMO 8 CARACTERES</span>
                        </div>
                        
                        <div id="rule-uppercase" class="rule-item">
                            <i class="fas fa-circle"></i>
                            <span>1 MAYÚSCULA</span>
                        </div>
                        
                        <div id="rule-special" class="rule-item">
                            <i class="fas fa-circle"></i>
                            <span>1 CARÁCTER ESPECIAL</span>
                        </div>
                    </div>
                </div>
                
                <div id="passwordError" class="password-error"></div>
                
                <div class="modal-buttons">
                    <button id="cancelChange" class="modal-btn modal-btn-cancel">
                        <i class="fas fa-times"></i> CANCELAR
                    </button>
                    <button id="savePassword" class="modal-btn modal-btn-save" disabled>
                        <i class="fas fa-save"></i> GUARDAR
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ========== REFERENCIAS ==========
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const toggleNewPassword = document.querySelector('.toggle-new-password');
        const toggleConfirmPassword = document.querySelector('.toggle-confirm-password');
        const passwordError = document.getElementById('passwordError');
        const savePasswordBtn = document.getElementById('savePassword');
        const cancelChangeBtn = document.getElementById('cancelChange');
        
        const ruleLength = document.getElementById('rule-length');
        const ruleUppercase = document.getElementById('rule-uppercase');
        const ruleSpecial = document.getElementById('rule-special');
        
        // ========== FUNCIÓN: Validar contraseña ==========
        function validatePassword(password) {
            const rules = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
            };
            return rules;
        }
        
        // ========== FUNCIÓN: Actualizar indicadores ==========
        function updateValidationIndicators(password) {
            const rules = validatePassword(password);
            
            const lengthIcon = ruleLength.querySelector('i');
            if (rules.length) {
                ruleLength.style.borderLeftColor = '#2ecc71';
                lengthIcon.style.color = '#2ecc71';
            } else {
                ruleLength.style.borderLeftColor = '#e74c3c';
                lengthIcon.style.color = '#e74c3c';
            }
            
            const upperIcon = ruleUppercase.querySelector('i');
            if (rules.uppercase) {
                ruleUppercase.style.borderLeftColor = '#2ecc71';
                upperIcon.style.color = '#2ecc71';
            } else {
                ruleUppercase.style.borderLeftColor = '#e74c3c';
                upperIcon.style.color = '#e74c3c';
            }
            
            const specialIcon = ruleSpecial.querySelector('i');
            if (rules.special) {
                ruleSpecial.style.borderLeftColor = '#2ecc71';
                specialIcon.style.color = '#2ecc71';
            } else {
                ruleSpecial.style.borderLeftColor = '#e74c3c';
                specialIcon.style.color = '#e74c3c';
            }
            
            return rules;
        }
        
        // ========== FUNCIÓN: Verificar estado del botón ==========
        function checkFormValidity() {
            const newPass = newPasswordInput.value;
            const confirmPass = confirmPasswordInput.value;
            const rules = validatePassword(newPass);
            
            const allRulesMet = rules.length && rules.uppercase && rules.special;
            const passwordsMatch = newPass === confirmPass && newPass !== '' && confirmPass !== '';
            
            if (allRulesMet && passwordsMatch) {
                savePasswordBtn.disabled = false;
                savePasswordBtn.style.opacity = '1';
                savePasswordBtn.style.pointerEvents = 'auto';
                savePasswordBtn.style.cursor = 'pointer';
                passwordError.style.display = 'none';
                return true;
            } else {
                savePasswordBtn.disabled = true;
                savePasswordBtn.style.opacity = '0.5';
                savePasswordBtn.style.pointerEvents = 'none';
                
                if (!allRulesMet && newPass !== '') {
                    passwordError.style.display = 'block';
                    passwordError.textContent = 'LA CONTRASEÑA NO CUMPLE CON TODAS LAS REGLAS DE SEGURIDAD';
                } else if (newPass !== '' && confirmPass !== '' && newPass !== confirmPass) {
                    passwordError.style.display = 'block';
                    passwordError.textContent = 'LAS CONTRASEÑAS NO COINCIDEN';
                } else {
                    passwordError.style.display = 'none';
                }
                return false;
            }
        }
        
        // ========== TOGGLES ==========
        if (toggleNewPassword) {
            toggleNewPassword.addEventListener('click', function() {
                const type = newPasswordInput.type === 'password' ? 'text' : 'password';
                newPasswordInput.type = type;
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
        
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener('click', function() {
                const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
                confirmPasswordInput.type = type;
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
        
        // ========== EVENTOS ==========
        newPasswordInput.addEventListener('input', function() {
            updateValidationIndicators(this.value);
            checkFormValidity();
        });
        
        confirmPasswordInput.addEventListener('input', function() {
            checkFormValidity();
        });
        
        // ========== BOTÓN GUARDAR ==========
        savePasswordBtn.addEventListener('click', async function() {
            const newPassword = newPasswordInput.value;
            
            savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';
            savePasswordBtn.disabled = true;
            
            try {
                const response = await fetch('php/cambio_contraseña/change_password.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        no_nomina: userData.no_nomina,
                        new_password: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Limpiar localStorage para asegurar que no hay sesiones previas
                    localStorage.clear();
                    
                    await Swal.fire({
                        icon: 'success',
                        title: '¡CONTRASEÑA ACTUALIZADA!',
                        text: 'SU CONTRASEÑA HA SIDO CAMBIADA EXITOSAMENTE. POR FAVOR, INICIE SESIÓN NUEVAMENTE.',
                        timer: 3000,
                        showConfirmButton: true,
                        confirmButtonText: 'ACEPTAR',
                        background: '#ffffff',
                        color: '#691a30'
                    });
                    
                    // Cerrar modal
                    modal.remove();
                    
                    // Ejecutar callback con éxito
                    callback(true);
                    
                } else {
                    throw new Error(data.message || 'ERROR AL CAMBIAR CONTRASEÑA');
                }
                
            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'ERROR',
                    text: 'NO SE PUDO CAMBIAR LA CONTRASEÑA. INTENTE NUEVAMENTE.',
                    confirmButtonColor: '#691a30'
                });
                
                savePasswordBtn.innerHTML = '<i class="fas fa-save"></i> GUARDAR';
                savePasswordBtn.disabled = false;
                checkFormValidity();
            }
        });
        
        // ========== BOTÓN CANCELAR ==========
        cancelChangeBtn.addEventListener('click', async function() {
            modal.remove();
            await Swal.fire({
                icon: 'warning',
                title: 'CAMBIO DE CONTRASEÑA REQUERIDO',
                text: 'ES OBLIGATORIO CAMBIAR LA CONTRASEÑA PARA CONTINUAR',
                confirmButtonColor: '#691a30',
                confirmButtonText: 'ACEPTAR'
            });
            callback(false);
        });
        
        // ========== CERRAR AL HACER CLIC FUERA ==========
        modal.addEventListener('click', async function(e) {
            if (e.target === modal) {
                modal.remove();
                await Swal.fire({
                    icon: 'warning',
                    title: 'CAMBIO DE CONTRASEÑA REQUERIDO',
                    text: 'ES OBLIGATORIO CAMBIAR LA CONTRASEÑA PARA CONTINUAR',
                    confirmButtonColor: '#691a30',
                    confirmButtonText: 'ACEPTAR'
                });
                callback(false);
            }
        });
    }
    
    // ========== FUNCIONES AUXILIARES ==========
    function setLoginButtonLoading(isLoading) {
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFICANDO CREDENCIALES...';
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>INGRESAR AL SISTEMA</span>';
        }
    }
    
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            
            const field = getFieldFromErrorId(elementId);
            if (field) {
                field.style.borderColor = '#e74c3c';
                field.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
            }
        }
    }
    
    function clearFieldError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
            
            const field = getFieldFromErrorId(errorId);
            if (field) {
                field.style.borderColor = '';
                field.style.boxShadow = '';
            }
        }
    }
    
    function getFieldFromErrorId(errorId) {
        switch(errorId) {
            case 'errorArea': return areaSelect;
            case 'errorUserType': return userTypeSelect;
            case 'errorWorkerCode': return workerCodeInput;
            case 'errorPassword': return passwordInput;
            default: return null;
        }
    }
});