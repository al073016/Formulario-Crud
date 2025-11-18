document.addEventListener('DOMContentLoaded', () => {
    
    // --- Selectores del DOM ---
    // Constantes para los elementos principales del DOM.
    const form = document.getElementById('form-persona');
    const tableBody = document.getElementById('table-body');
    const loader = document.getElementById('loader');

    // Constantes para los elementos del modal.
    const modal = document.getElementById('modal-persona');
    const modalTitulo = document.getElementById('modal-titulo');
    const btnCerrarModal = document.querySelector('.close-btn');
    const btnNuevo = document.getElementById('btn-nuevo');
    const hiddenId = document.getElementById('persona-id');
    const modalLoader = document.getElementById('modal-loader');
    const btnModalDelete = document.getElementById('btn-modal-delete');

    // Constantes para los elementos de búsqueda.
    const formBuscar = document.getElementById('form-buscar');
    const inputBuscar = document.getElementById('buscar-id');
    const btnMostrarTodos = document.getElementById('btn-mostrar-todos');

    // Almacena la lista completa de personas de la API.
    let todasLasPersonas = [];
    
    // --- Event Listeners ---
    // Asigna las funciones principales a los eventos de la página.
    
    fetchData(); // Carga inicial de datos.

    form.addEventListener('submit', handleFormSubmit);
    tableBody.addEventListener('click', handleTableClick);

    // Asigna las funciones para abrir y cerrar el modal.
    btnNuevo.addEventListener('click', () => abrirModal(null));
    btnCerrarModal.addEventListener('click', cerrarModal);
    
    // Asigna el manejador para el botón de borrado en el modal.
    btnModalDelete.addEventListener('click', () => {
        const id = hiddenId.value; 
        if (id) {
            cerrarModal(); 
            handleDelete(id); 
        }
    });

    // Asigna los manejadores para el formulario de búsqueda.
    formBuscar.addEventListener('submit', handleBuscar);
    btnMostrarTodos.addEventListener('click', () => {
        inputBuscar.value = ''; // Limpia el campo.
        updateTable(todasLasPersonas); // Muestra la tabla completa.
    });

    // --- Funciones de Carga (Loaders) ---
    // Muestra/oculta el loader principal y la tabla.
    function setCargando(cargando) {
        loader.style.display = cargando ? 'block' : 'none';
        tableBody.style.display = cargando ? 'none' : '';
    }
    
    // Muestra/oculta el loader del modal y deshabilita el botón de guardar.
    function setCargandoModal(cargando) {
        modalLoader.style.display = cargando ? 'block' : 'none';
        
        const botonGuardar = form.querySelector('[type="submit"]');
        if (botonGuardar) {
            botonGuardar.disabled = cargando;
        }
    }

    // --- Funciones del MODAL ---
    // Configura y muestra el modal, sea para 'Crear' (null) o 'Editar' (con datos).
    function abrirModal(persona) {
        form.reset(); 
        hiddenId.value = ''; 

        if (persona) {
            // Modo Edición: Rellena el formulario con los datos de la persona.
            modalTitulo.textContent = 'Editar Persona';
            hiddenId.value = persona.id;
            form.nombre.value = persona.nombre;
            form.apellido.value = persona.apellido;
            form.sexo.value = persona.sexo.toLowerCase();
            form.fh_nac.value = persona.fh_nac;
            form.id_rol.value = persona.id_rol; 
            
            // Muestra el botón de borrar.
            btnModalDelete.style.display = 'inline-block'; 
            
        } else {
            // Modo Creación: Prepara el formulario para un nuevo registro.
            modalTitulo.textContent = 'Agregar Persona';
            
            // Oculta el botón de borrar.
            btnModalDelete.style.display = 'none'; 
        }
        modal.style.display = 'block'; // Muestra el modal.
    }

    // Oculta el modal.
    function cerrarModal() {
        modal.style.display = 'none';
    }

    // --- Función READ (Lectura) ---
    // Obtiene la lista completa de personas de la API.
    async function fetchData() {
        setCargando(true);
        try {
            const response = await fetch('https://fi.jcaguilar.dev/v1/escuela/persona');
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            
            const data = await response.json();
            
            // Almacena los datos en la variable local.
            todasLasPersonas = data; 
            
            // Dibuja la tabla con los datos obtenidos.
            updateTable(todasLasPersonas); 
        } catch (error) {
            console.error('Error al cargar los datos:', error);
            tableBody.innerHTML = '<tr><td colspan="7">Error al cargar datos.</td></tr>';
        } finally {
            setCargando(false);
        }
    }

    // --- Función de pintar tabla ---
    // Dibuja las filas (TR) en el <tbody> de la tabla.
    function updateTable(data) {
        tableBody.innerHTML = ''; 
        data.forEach(persona => {
            const row = document.createElement('tr');
            // Almacena el objeto JSON de la persona en el 'data-set' de la fila.
            row.dataset.persona = JSON.stringify(persona); 
            row.innerHTML = `
                <td>${persona.id}</td>
                <td>${persona.nombre}</td>
                <td>${persona.apellido}</td>
                <td>${persona.sexo}</td>
                <td>${persona.fh_nac}</td>
                <td>${persona.rol}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // --- Manejador de Búsqueda ---
    // Filtra la lista 'todasLasPersonas' localmente por el ID ingresado.
    function handleBuscar(event) {
        event.preventDefault();
        const idBuscado = parseInt(inputBuscar.value, 10);

        if (isNaN(idBuscado)) {
            alert('Por favor, ingresa un ID numérico válido.');
            return;
        }

        const resultado = todasLasPersonas.filter(persona => persona.id === idBuscado);

        if (resultado.length > 0) {
            // Actualiza la tabla solo con los resultados del filtro.
            updateTable(resultado);
        } else {
            // Muestra un mensaje si no hay resultados.
            alert('No se encontró ninguna persona con ese ID.');
            tableBody.innerHTML = '<tr><td colspan="7">ID no encontrado.</td></tr>';
        }
    }

    // --- Función unificada de CREATE (POST) y UPDATE (PATCH) ---
    // Maneja el envío del formulario del modal.
    async function handleFormSubmit(event) {
        event.preventDefault(); // Previene la recarga de la página.
        
        // Determina si es una operación de Creación (id vacío) o Edición (id con valor).
        const id = hiddenId.value; 
        
        // Recolecta y ajusta los datos del formulario.
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.id_rol = parseInt(data.id_rol, 10);
        data.sexo = data.sexo.toUpperCase();

        // Validación de campos requeridos.
        if (!data.nombre || !data.apellido || !data.fh_nac || !data.sexo) {
            alert("Por favor, completa todos los campos.");
            return; 
        }

        let url = 'https://fi.jcaguilar.dev/v1/escuela/persona';
        let method = '';

        // Configura la petición (POST para Crear, PATCH para Editar).
        if (id) {
            method = 'PATCH';
            data.id_persona = parseInt(id, 10); 
        } else {
            method = 'POST';
            data.id_persona = 0; 
        }

        setCargandoModal(true);
        try {
            // Envía la petición a la API.
            const response = await fetch(url, {
                method: method, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Petición exitosa: notifica, cierra modal y recarga la tabla.
                const resultado = await response.json();
                alert(`Operación exitosa. ID: ${id || resultado}`);
                cerrarModal();
                fetchData(); 
                inputBuscar.value = ''; 
            } else {
                // Error de la API: notifica el error devuelto.
                const errorData = await response.json();
                alert('Error al guardar: ' + (errorData.message || 'Error desconocido'));
            }
        } catch (error) {
            // Error de Red: notifica el error de conexión.
            console.error('Error de red:', error);
            alert('Error de conexión. Inténtalo de nuevo.');
        } finally {
            // Bloque 'finally': se ejecuta siempre para ocultar el loader del modal.
            setCargandoModal(false);
        }
    }

    // --- Manejador de clics en la tabla ---
    // Se dispara al hacer clic en cualquier parte del <tbody>.
    function handleTableClick(event) {
        const row = event.target.closest('tr');
        if (!row) return; 

        // Lee los datos JSON de la fila clickeada.
        const personaData = JSON.parse(row.dataset.persona);
        
        // Abre el modal en modo Edición con esos datos.
        abrirModal(personaData);
    }

    // --- Función DELETE (Borrado) ---
    // Maneja la lógica de borrado de un registro.
    async function handleDelete(id) {
        // Muestra una confirmación antes de borrar.
        if (!confirm(`¿Estás seguro de que deseas borrar el registro con ID ${id}?`)) {
            return; 
        }
        
        setCargando(true); 
        try {
            // Envía la petición DELETE a la API.
            const response = await fetch('https://fi.jcaguilar.dev/v1/escuela/persona', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_persona: parseInt(id, 10) })
            });

            if (response.ok) {
                // Petición exitosa: notifica y recarga la tabla.
                alert('Persona eliminada correctamente.');
                fetchData(); 
                inputBuscar.value = ''; 
            } else {
                const errorData = await response.json();
                alert('Error al eliminar: ' + (errorData.message || 'No se pudo borrar'));
            }
        } catch (error) {
            console.error('Error de red al eliminar:', error);
            alert('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    }
});