// Mejoras progresivas: todo funciona igual sin JavaScript, salvo copiar e imprimir.
document.addEventListener('DOMContentLoaded', () => {
  // Llevar el foco al resumen de errores de un formulario.
  const resumen = document.querySelector('[data-enfocar]');
  if (resumen) resumen.focus();

  // Imprimir comprobante.
  document.querySelectorAll('[data-imprimir]').forEach((boton) => {
    boton.addEventListener('click', () => window.print());
  });

  // Copiar el link de vista previa.
  const estadoCopia = document.getElementById('estado-copia');
  document.querySelectorAll('[data-copiar]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const url = new URL(boton.dataset.copiar, window.location.origin).href;
      try {
        await navigator.clipboard.writeText(url);
        const original = boton.innerHTML;
        boton.textContent = '¡Copiado!';
        if (estadoCopia) estadoCopia.textContent = `Link copiado: ${url}`;
        setTimeout(() => (boton.innerHTML = original), 2000);
      } catch {
        window.prompt('Copiá el link:', url);
      }
    });
  });

  // Agregar filas de horarios, productos o fotos.
  document.querySelectorAll('[data-agregar]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const tipo = boton.dataset.agregar;
      const filas = document.getElementById(`filas-${tipo}`);
      const plantilla = document.getElementById(`plantilla-${tipo}`);
      const n = filas.children.length + 1;
      filas.insertAdjacentHTML('beforeend', plantilla.innerHTML.replaceAll('__N__', n));
      const nueva = filas.lastElementChild.querySelector('input');
      if (nueva) nueva.focus();
    });
  });

  // Confirmar acciones delicadas (por ejemplo, suspender).
  document.querySelectorAll('form[data-confirmar]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!window.confirm(form.dataset.confirmar)) e.preventDefault();
    });
  });
});
