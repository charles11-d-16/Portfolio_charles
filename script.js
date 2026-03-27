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

    const setupExperienceCarousel = () => {
        const viewport = document.querySelector('.experience__viewport');
        if (!viewport) return;

        const items = Array.from(viewport.querySelectorAll('.experience__item'));
        if (items.length === 0) return;

        let autoTimerId = null;
        let resumeTimerId = null;
        let rafId = null;
        let activeIndex = 0;

        const updateActive = () => {
            const center = viewport.scrollLeft + viewport.clientWidth / 2;
            let closestIndex = 0;
            let closestDistance = Number.POSITIVE_INFINITY;

            for (let i = 0; i < items.length; i += 1) {
                const item = items[i];
                const itemCenter = item.offsetLeft + item.offsetWidth / 2;
                const distance = Math.abs(center - itemCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }

            activeIndex = closestIndex;
            for (let i = 0; i < items.length; i += 1) {
                items[i].classList.toggle('is-active', i === activeIndex);
            }
        };

        const scrollToIndex = (index, behavior = 'smooth') => {
            const item = items[index];
            const targetLeft = item.offsetLeft - (viewport.clientWidth - item.offsetWidth) / 2;
            viewport.scrollTo({ left: targetLeft, behavior });
        };

        const stopAuto = () => {
            if (autoTimerId !== null) {
                window.clearInterval(autoTimerId);
                autoTimerId = null;
            }
        };

        const startAuto = () => {
            stopAuto();
            if (viewport.matches(':hover')) return;
            autoTimerId = window.setInterval(() => {
                const nextIndex = (activeIndex + 1) % items.length;
                scrollToIndex(nextIndex, 'smooth');
            }, 3400);
        };

        const pauseAuto = (resumeAfterMs = 4200) => {
            stopAuto();
            if (resumeTimerId !== null) window.clearTimeout(resumeTimerId);
            resumeTimerId = window.setTimeout(() => startAuto(), resumeAfterMs);
        };

        const scheduleActiveUpdate = () => {
            if (rafId !== null) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = null;
                updateActive();
            });
        };

        viewport.addEventListener('scroll', () => {
            scheduleActiveUpdate();
            pauseAuto();
        }, { passive: true });

        viewport.addEventListener('pointerenter', () => stopAuto(), { passive: true });
        viewport.addEventListener('pointerleave', () => startAuto(), { passive: true });

        viewport.addEventListener('wheel', (event) => {
            const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
            if (maxScrollLeft <= 1) return;

            // Translate vertical wheel into horizontal scroll while hovering the carousel.
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                event.preventDefault();
                viewport.scrollLeft += event.deltaY;
            }
        }, { passive: false });

        window.addEventListener('resize', () => {
            updateActive();
            scrollToIndex(activeIndex, 'auto');
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopAuto();
            else startAuto();
        }, { passive: true });

        updateActive();
        scrollToIndex(0, 'auto');
        startAuto();
    };

    setupExperienceCarousel();
})();
