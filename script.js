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
        const viewports = Array.from(document.querySelectorAll('.experience__viewport'));
        if (viewports.length === 0) return;

        viewports.forEach((viewport) => {
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

        const autoOnly = viewport.hasAttribute('data-auto-only');
        let lastDragEndAt = 0;

        viewport.addEventListener('scroll', () => {
            scheduleActiveUpdate();
            if (!autoOnly) pauseAuto();
        }, { passive: true });

        viewport.addEventListener('pointerenter', () => stopAuto(), { passive: true });
        viewport.addEventListener('pointerleave', () => startAuto(), { passive: true });

        if (!autoOnly) {
            viewport.addEventListener('wheel', (event) => {
                const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
                if (maxScrollLeft <= 1) return;

                // Translate vertical wheel into horizontal scroll while hovering the carousel.
                if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                    event.preventDefault();
                    viewport.scrollLeft += event.deltaY;
                }
            }, { passive: false });
        }

        // Drag-to-scroll with mouse / touch.
        let dragPointerId = null;
        let dragStartX = 0;
        let dragStartScrollLeft = 0;
        let didDrag = false;

        const isInteractiveTarget = (target) => {
            if (!(target instanceof Element)) return false;
            return Boolean(target.closest('button, a, input, textarea, select, label'));
        };

        viewport.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            if (dragPointerId !== null) return;
            if (isInteractiveTarget(event.target)) return;

            dragPointerId = event.pointerId;
            dragStartX = event.clientX;
            dragStartScrollLeft = viewport.scrollLeft;
            didDrag = false;

            stopAuto();
            viewport.classList.add('is-dragging');
            viewport.setPointerCapture(event.pointerId);
        });

        viewport.addEventListener('pointermove', (event) => {
            if (dragPointerId === null || event.pointerId !== dragPointerId) return;

            const dx = event.clientX - dragStartX;
            if (!didDrag && Math.abs(dx) > 4) didDrag = true;
            viewport.scrollLeft = dragStartScrollLeft - dx;

            if (didDrag) event.preventDefault();
        }, { passive: false });

        const endDrag = () => {
            if (dragPointerId === null) return;
            dragPointerId = null;
            viewport.classList.remove('is-dragging');

            if (didDrag) {
                lastDragEndAt = Date.now();
                pauseAuto(2600);
            } else {
                startAuto();
            }
        };

        viewport.addEventListener('pointerup', endDrag);
        viewport.addEventListener('pointercancel', endDrag);
        viewport.addEventListener('lostpointercapture', endDrag);

        viewport.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            if (isInteractiveTarget(event.target)) return;

            const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
            if (maxScrollLeft <= 1) return;

            event.preventDefault();
            updateActive();

            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = Math.max(0, Math.min(items.length - 1, activeIndex + direction));
            if (nextIndex === activeIndex) return;

            stopAuto();
            scrollToIndex(nextIndex, 'smooth');
            pauseAuto(4200);
        });

        // "Read more..." modal
        const modal = document.getElementById('experience-modal');
        if (modal) {
            const titleEl = document.getElementById('experience-modal-title') || modal.querySelector('.experience-modal__title');
            const roleEl = document.getElementById('experience-modal-role') || modal.querySelector('.experience-modal__role');
            const dateEl = document.getElementById('experience-modal-date') || modal.querySelector('.experience-modal__date');
            const bodyEl = document.getElementById('experience-modal-body') || modal.querySelector('.experience-modal__text');
            const dotEl = modal.querySelector('.experience-modal__dot');
            const closeBtn = modal.querySelector('[data-modal-close]');

            let lastTrigger = null;

            const getFocusable = () => Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'))
                .filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

            const openModal = (item, trigger) => {
                const titleText = item.dataset.experienceTitle
                    || item.querySelector('.experience__item-title')?.textContent?.trim()
                    || 'Experience';

                const roleText = item.dataset.experienceRole
                    || item.querySelector('.experience__item-role')?.textContent?.trim()
                    || '';

                const dateText = item.dataset.experienceDate
                    || item.querySelector('.experience__item-date')?.textContent?.trim()
                    || '';

                const bodyText = item.dataset.experienceText
                    || item.querySelector('.experience__item-text')?.textContent?.trim()
                    || '';

                if (titleEl) titleEl.textContent = titleText;
                if (roleEl) roleEl.textContent = roleText;
                if (dateEl) dateEl.textContent = dateText;
                if (bodyEl) bodyEl.textContent = bodyText;
                if (dotEl) dotEl.hidden = !(roleText && dateText);

                lastTrigger = trigger;
                stopAuto();
                document.body.classList.add('is-modal-open');
                modal.hidden = false;

                window.setTimeout(() => {
                    const focusables = getFocusable();
                    if (focusables[0] instanceof HTMLElement) focusables[0].focus();
                }, 0);
            };

            const closeModal = () => {
                modal.hidden = true;
                document.body.classList.remove('is-modal-open');
                if (lastTrigger instanceof HTMLElement) lastTrigger.focus();
                lastTrigger = null;
                startAuto();
            };

            if (closeBtn) closeBtn.addEventListener('click', closeModal);

            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeModal();
            });

            document.addEventListener('keydown', (event) => {
                if (modal.hidden) return;

                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeModal();
                    return;
                }

                if (event.key === 'Tab') {
                    const focusables = getFocusable();
                    if (focusables.length === 0) return;

                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];

                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            });

            viewport.addEventListener('click', (event) => {
                if (Date.now() - lastDragEndAt < 250) return;
                const target = event.target instanceof Element ? event.target : event.target?.parentElement;
                if (!target) return;
                const button = target.closest('.experience__readmore');
                if (!button) return;
                const item = button.closest('.experience__item');
                if (!item) return;
                openModal(item, button);
            });
        }

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
        });
    };

    const setupSectionNav = () => {
        const scroller = document.querySelector('.hero__pages');
        const nav = document.querySelector('[data-section-nav]');
        if (!scroller || !nav) return;

        const topNavLinks = Array.from(document.querySelectorAll('.site-nav__link[href^="#"]'));
        const linkByHash = new Map(
            topNavLinks
                .map((link) => [link.getAttribute('href'), link])
                .filter(([hash]) => typeof hash === 'string' && hash.length > 1),
        );

        const btnUp = nav.querySelector('[data-nav-up]');
        const btnDown = nav.querySelector('[data-nav-down]');
        if (!btnUp || !btnDown) return;

        const sections = Array.from(scroller.querySelectorAll('.hero__page'));
        if (sections.length <= 1) {
            nav.hidden = true;
            return;
        }

        let rafId = null;
        let activeIndex = 0;

        const getActiveIndex = () => {
            const center = scroller.scrollTop + scroller.clientHeight / 2;
            let closestIndex = 0;
            let closestDistance = Number.POSITIVE_INFINITY;

            for (let i = 0; i < sections.length; i += 1) {
                const section = sections[i];
                const sectionCenter = section.offsetTop + section.offsetHeight / 2;
                const distance = Math.abs(center - sectionCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }

            return closestIndex;
        };

        const update = () => {
            activeIndex = getActiveIndex();
            btnUp.hidden = activeIndex === 0;
            btnDown.hidden = activeIndex === sections.length - 1;

            if (topNavLinks.length > 0) {
                const activeSection = sections[activeIndex];
                const currentHash = window.location.hash;

                let activeHash = null;
                if (currentHash && linkByHash.has(currentHash)) {
                    const target = document.getElementById(currentHash.slice(1));
                    if (target && activeSection && activeSection.contains(target)) {
                        activeHash = currentHash;
                    }
                }

                if (!activeHash && activeSection?.id) {
                    const sectionHash = `#${activeSection.id}`;
                    if (linkByHash.has(sectionHash)) activeHash = sectionHash;
                }

                topNavLinks.forEach((link) => {
                    const href = link.getAttribute('href');
                    link.classList.toggle('is-active', !!activeHash && href === activeHash);
                });
            }
        };

        const scheduleUpdate = () => {
            if (rafId !== null) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = null;
                update();
            });
        };

        btnUp.addEventListener('click', () => {
            update();
            const nextIndex = Math.max(0, activeIndex - 1);
            sections[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        btnDown.addEventListener('click', () => {
            update();
            const nextIndex = Math.min(sections.length - 1, activeIndex + 1);
            sections[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        scroller.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate, { passive: true });
        window.addEventListener('hashchange', scheduleUpdate, { passive: true });

        update();
    };

    const setupProjectModal = () => {
        const modal = document.getElementById('project-modal');
        const titleEl = document.getElementById('project-modal-title');
        const galleryEl = document.getElementById('project-modal-gallery');
        if (!modal || !titleEl || !galleryEl) return;

        const closeBtn = modal.querySelector('[data-project-modal-close]');
        const triggers = Array.from(document.querySelectorAll('.project__view-btn[data-project-modal]'));
        if (triggers.length === 0) return;

        let lastTrigger = null;

        const isFocusVisible = (el) => {
            try {
                return el instanceof HTMLElement && el.matches(':focus-visible');
            } catch {
                return false;
            }
        };

        const parseGalleryJson = (galleryId) => {
            if (!galleryId) return [];
            const node = document.getElementById(galleryId);
            if (!node) return [];

            try {
                const parsed = JSON.parse(node.textContent || '[]');
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch {
                return [];
            }
        };

        const setImages = (paths) => {
            galleryEl.replaceChildren();

            paths.forEach((src) => {
                const img = document.createElement('img');
                img.src = encodeURI(src);
                img.alt = '';
                img.loading = 'lazy';
                galleryEl.appendChild(img);
            });
        };

        const openModal = (trigger, restoreFocus = false) => {
            const card = trigger.closest('.project-card') || trigger.closest('.experience__item');
            const titleText = card?.querySelector('.experience__item-title')?.textContent?.trim() || 'Project';
            const galleryId = trigger.getAttribute('data-project-gallery') || '';
            const images = parseGalleryJson(galleryId);

            titleEl.textContent = titleText;
            setImages(images);

            modal.classList.toggle('project-modal--single', images.length <= 1);
            lastTrigger = restoreFocus ? trigger : null;
            document.documentElement.classList.add('is-project-modal-open');
            modal.hidden = false;

            window.setTimeout(() => {
                if (closeBtn instanceof HTMLElement) closeBtn.focus();
            }, 0);
        };

        const closeModal = () => {
            modal.hidden = true;
            document.documentElement.classList.remove('is-project-modal-open');
            galleryEl.replaceChildren();
            modal.classList.remove('project-modal--single');

            if (lastTrigger instanceof HTMLElement) lastTrigger.focus();
            lastTrigger = null;
        };

        triggers.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                openModal(btn, isFocusVisible(btn));
            });
        });

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });

        document.addEventListener('keydown', (event) => {
            if (modal.hidden) return;
            if (event.key !== 'Escape') return;
            event.preventDefault();
            closeModal();
        });
    };

    setupExperienceCarousel();
    setupSectionNav();
    setupProjectModal();
})();
