/**
 * Natalia's Portfolio - Core Client-Side Logic
 * Highly performant, fully accessible, vanilla JavaScript for interactive elements.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Hamburger Toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && navMenu) {
    const toggleMenu = () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.classList.toggle('menu-open'); // Prevent scrolling behind menu if desired
    };

    navToggle.addEventListener('click', toggleMenu);

    // Close menu when a navigation link is clicked (crucial for single page navigation)
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
          toggleMenu();
        }
      });
    });

    // Close menu when clicking outside of it
    document.addEventListener('click', (event) => {
      const isClickInside = navMenu.contains(event.target) || navToggle.contains(event.target);
      if (!isClickInside && navMenu.classList.contains('active')) {
        toggleMenu();
      }
    });

    // Support ESC key to close mobile menu
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('active')) {
        toggleMenu();
      }
    });
  }

  // 2. Active Header Background on Scroll
  const header = document.querySelector('header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
  }

  // 3. Dynamic Footer Copyright Year
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // 4. Form Submission Interaction (Accessible UX Enhancement)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      // In a pure static page for GitHub Pages, we let the default behavior or show a nice thank-you interaction
      // Let's intercept to show a visual confirmation modal/alert and then reset the form.
      event.preventDefault();
      
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      // Accessibility: Set status live region announcement
      const formStatus = document.getElementById('formStatus') || document.createElement('div');
      formStatus.id = 'formStatus';
      formStatus.className = 'sr-only';
      formStatus.setAttribute('role', 'status');
      formStatus.setAttribute('aria-live', 'polite');
      if (!document.getElementById('formStatus')) {
        contactForm.appendChild(formStatus);
      }

      // Visual Loading state
      submitButton.disabled = true;
      submitButton.textContent = 'Sending Message...';
      formStatus.textContent = 'Submitting form, please wait.';

      setTimeout(() => {
        // Success State Animation
        submitButton.style.backgroundColor = '#5D8C5A'; // Clean green
        submitButton.textContent = '✓ Message Sent!';
        formStatus.textContent = 'Success! Your message was sent successfully. Natalia will get back to you soon.';
        
        // Show non-obtrusive alert or card within container
        const successMessage = document.createElement('div');
        successMessage.style.marginTop = '1.5rem';
        successMessage.style.padding = '1rem';
        successMessage.style.backgroundColor = '#FAF9F6';
        successMessage.style.border = '1px solid #C5A059';
        successMessage.style.borderRadius = '4px';
        successMessage.style.color = '#292524';
        successMessage.style.fontFamily = 'var(--font-body)';
        successMessage.style.fontSize = '0.95rem';
        successMessage.style.textAlign = 'center';
        successMessage.innerHTML = '<strong>Thank you!</strong> Your message has been sent successfully. Since this is a static prototype on GitHub Pages, your form was simulated, but Natalia would love to connect with you via LinkedIn or Email!';
        
        contactForm.appendChild(successMessage);
        contactForm.reset();

        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.style.backgroundColor = '';
          submitButton.textContent = originalText;
          successMessage.remove();
        }, 8000);
      }, 1500);
    });
  }

  // 5. Scroll Spy: Highlight Active Section in Navbar
  const sections = document.querySelectorAll('section');
  
  if (sections.length > 0) {
    const scrollSpy = () => {
      const scrollPosition = window.scrollY + 120; // Offset for sticky nav height

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPosition >= top && scrollPosition < top + height) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
              link.style.color = 'var(--accent-hover)';
            } else {
              link.style.color = '';
            }
          });
        }
      });
    };

    window.addEventListener('scroll', scrollSpy, { passive: true });
    scrollSpy(); // Initial check
  }

  // 6. Portfolio Showcase Interactive Modals
  const openButtons = document.querySelectorAll('.open-portfolio-modal');
  const closeButtons = document.querySelectorAll('.modal-close');
  const overlays = document.querySelectorAll('.modal-overlay');
  const modals = document.querySelectorAll('.portfolio-modal');

  const openModal = (modalId) => {
    const targetModal = document.getElementById(modalId);
    if (targetModal) {
      targetModal.style.display = 'flex';
      // Force repaint to trigger CSS transitions
      targetModal.offsetHeight; 
      targetModal.classList.add('active');
      targetModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open-scroll-lock');
      
      // Focus on the close button for accessibility
      const closeBtn = targetModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    }
  };

  const closeModal = (modal) => {
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open-scroll-lock');
      
      setTimeout(() => {
        modal.style.display = 'none';
      }, 400); // Match CSS transition duration
    }
  };

  openButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = button.getAttribute('data-modal-target');
      openModal(targetId);
    });
  });

  closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = button.closest('.portfolio-modal');
      closeModal(modal);
    });
  });

  overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = overlay.closest('.portfolio-modal');
      closeModal(modal);
    });
  });

  // Support ESC key to close open modals and lightboxes
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const activeLightbox = document.querySelector('.lightbox.active');
      if (activeLightbox) {
        closeLightbox();
        return;
      }
      const activeModal = document.querySelector('.portfolio-modal.active');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  });

  // 7. Interactive Lightbox (Image Zoom) Gallery Engine
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  const galleryImages = document.querySelectorAll('.gallery-image-wrapper');

  const openLightbox = (imgSrc, imgAlt) => {
    if (lightbox && lightboxImg && lightboxCaption) {
      lightboxImg.src = imgSrc;
      lightboxImg.alt = imgAlt;
      lightboxCaption.textContent = imgAlt || 'Portfolio Asset Preview';
      lightbox.style.display = 'flex';
      // Force layout calculation
      lightbox.offsetHeight;
      lightbox.classList.add('active');
    }
  };

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('active');
      setTimeout(() => {
        lightbox.style.display = 'none';
        if (lightboxImg) lightboxImg.src = '';
      }, 300);
    }
  };

  galleryImages.forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      const img = wrapper.querySelector('img');
      if (img) {
        openLightbox(img.src, img.alt);
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      // Close only if clicking the background backdrop directly
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }
});
