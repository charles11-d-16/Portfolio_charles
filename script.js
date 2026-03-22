(() => {
    const copyButtons = document.querySelectorAll('.hero__tooltip-copy-btn[data-copy]');
    const socialItems = document.querySelectorAll('.hero__social-item');

    const fallbackCopy = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        textarea.style.left = '-1000px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch {
            // ignore
        }
        document.body.removeChild(textarea);
    };

    copyButtons.forEach((button) => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            const text = button.getAttribute('data-copy') || '';
            if (!text) return;

            try {
                await navigator.clipboard.writeText(text);
            } catch {
                fallbackCopy(text);
            }

            // Prevent tooltip from "sticking" due to focus after click.
            button.blur();
        });
    });

    // Hide tooltips on mouse-out even if an element remains focused after click.
    socialItems.forEach((item) => {
        item.addEventListener('pointerleave', () => {
            const active = document.activeElement;
            if (active && item.contains(active) && active instanceof HTMLElement) {
                active.blur();
            }
        });
    });
})();
