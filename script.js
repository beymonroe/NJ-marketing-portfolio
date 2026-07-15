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

  // 4. Form Submission Interaction (Connects to MongoDB Atlas backend)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
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

      // Extract form values
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const subject = formData.get('subject');
      const message = formData.get('message');

      // Create success/error card container
      const resultMessage = document.createElement('div');
      resultMessage.style.marginTop = '1.5rem';
      resultMessage.style.padding = '1rem';
      resultMessage.style.borderRadius = '4px';
      resultMessage.style.fontSize = '0.95rem';
      resultMessage.style.textAlign = 'center';
      resultMessage.style.fontFamily = 'var(--font-body)';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, subject, message }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Success State Animation
          submitButton.style.backgroundColor = '#5D8C5A'; // Clean green
          submitButton.textContent = '✓ Message Sent!';
          formStatus.textContent = 'Success! Your message was sent and saved to MongoDB successfully.';
          
          resultMessage.style.backgroundColor = '#FAF9F6';
          resultMessage.style.border = '1px solid #5D8C5A';
          resultMessage.style.color = '#1c3d1b';
          resultMessage.innerHTML = '<strong>Success!</strong> Your message has been saved directly to the MongoDB Atlas database. Natalia will get back to you soon!';
          
          contactForm.appendChild(resultMessage);
          contactForm.reset();

          setTimeout(() => {
            submitButton.disabled = false;
            submitButton.style.backgroundColor = '';
            submitButton.textContent = originalText;
            resultMessage.remove();
          }, 8000);
        } else {
          // Handle server-returned validation or configuration error
          submitButton.style.backgroundColor = '#C96464'; // Soft warning red
          submitButton.textContent = 'Connection Setup Needed';
          
          resultMessage.style.backgroundColor = '#FFF5F5';
          resultMessage.style.border = '1px solid #C96464';
          resultMessage.style.color = '#7C2D12';
          
          if (data.isConfigError) {
            formStatus.textContent = 'MongoDB Atlas database is not yet connected. Configure MONGODB_URI to store submissions.';
            resultMessage.innerHTML = `<strong>MongoDB Setup Required:</strong> Your form code is ready, but your MongoDB Atlas database is not connected yet.<br><br>Please go to the <strong>Settings (Gear icon) &gt; Environment Variables</strong> panel in the AI Studio sidebar and add your <code>MONGODB_URI</code> connection string to activate the live database.`;
          } else {
            formStatus.textContent = 'Error sending message: ' + (data.error || 'Server error');
            resultMessage.innerHTML = `<strong>Error:</strong> ${data.error || 'Failed to send message.'}`;
          }
          
          contactForm.appendChild(resultMessage);

          setTimeout(() => {
            submitButton.disabled = false;
            submitButton.style.backgroundColor = '';
            submitButton.textContent = originalText;
          }, 6000);

          // Add a button inside the message card to dismiss it
          const dismissBtn = document.createElement('button');
          dismissBtn.textContent = 'Dismiss';
          dismissBtn.style.display = 'block';
          dismissBtn.style.margin = '0.5rem auto 0';
          dismissBtn.style.fontSize = '0.8rem';
          dismissBtn.style.padding = '0.2rem 0.6rem';
          dismissBtn.style.border = '1px solid #C96464';
          dismissBtn.style.borderRadius = '3px';
          dismissBtn.style.backgroundColor = 'transparent';
          dismissBtn.style.cursor = 'pointer';
          dismissBtn.style.color = '#7C2D12';
          dismissBtn.addEventListener('click', () => resultMessage.remove());
          resultMessage.appendChild(dismissBtn);
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        submitButton.style.backgroundColor = '#C96464';
        submitButton.textContent = 'Connection Error';
        formStatus.textContent = 'Failed to submit form due to a network connection error.';
        
        resultMessage.style.backgroundColor = '#FFF5F5';
        resultMessage.style.border = '1px solid #C96464';
        resultMessage.style.color = '#7C2D12';
        resultMessage.innerHTML = '<strong>Connection Error:</strong> Could not reach the server. Make sure the development server is running and try again.';
        contactForm.appendChild(resultMessage);

        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.style.backgroundColor = '';
          submitButton.textContent = originalText;
        }, 6000);

        // Add a button to dismiss
        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.style.display = 'block';
        dismissBtn.style.margin = '0.5rem auto 0';
        dismissBtn.style.fontSize = '0.8rem';
        dismissBtn.style.padding = '0.2rem 0.6rem';
        dismissBtn.style.border = '1px solid #C96464';
        dismissBtn.style.borderRadius = '3px';
        dismissBtn.style.backgroundColor = 'transparent';
        dismissBtn.style.cursor = 'pointer';
        dismissBtn.style.color = '#7C2D12';
        dismissBtn.addEventListener('click', () => resultMessage.remove());
        resultMessage.appendChild(dismissBtn);
      }
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
