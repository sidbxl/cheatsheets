// script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Auto-update Year in Footer ---
    // (Moved from inline script for better organization)
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- 1. Active Navbar Link ---
    // (More robust than manual class - assuming navbar.html structure)
    const currentLocation = window.location.pathname.split('/').pop(); // Get current file name
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation ||
            (currentLocation === '' && link.getAttribute('href') === 'index.html')) { // Handle root path for index
            link.classList.add('active');
        }
    });

    // --- 2. Responsive Navbar (Hamburger Menu) ---
    const nav = document.querySelector('nav');
    const navUl = document.querySelector('nav ul');
    if (nav && navUl) {
        const hamburger = document.createElement('button');
        hamburger.innerHTML = '☰ <span class="visually-hidden">Menu</span>'; // Hamburger icon + accessible text
        hamburger.classList.add('nav-toggle');
        nav.insertBefore(hamburger, navUl);

        hamburger.addEventListener('click', () => {
            navUl.classList.toggle('active');
            hamburger.classList.toggle('open');
            // ARIA attribute for accessibility
            const isExpanded = navUl.classList.contains('active');
            hamburger.setAttribute('aria-expanded', isExpanded.toString());
        });
    }

    // --- 3. "Back to Top" Button ---
    const backToTopButton = document.createElement('button');
    backToTopButton.textContent = '↑';
    backToTopButton.classList.add('back-to-top');
    backToTopButton.setAttribute('title', 'Go to top');
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) { // Show button after scrolling 300px
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- 4. Basic Table of Contents (ToC) ---
    const tocContainer = document.createElement('aside');
    tocContainer.id = 'toc-container';
    const tocList = document.createElement('ul');
    tocList.id = 'toc-list';
    const tocTitle = document.createElement('h3');
    // For French version, you'd need a separate script or conditional logic for "Table des Matières"
    tocTitle.textContent = document.documentElement.lang === 'fr' ? 'Table des Matières' : 'Table of Contents';
    tocContainer.appendChild(tocTitle);
    tocContainer.appendChild(tocList);

    const mainContentArea = document.querySelector('main');
    const currentFile = window.location.pathname.split('/').pop();

    if (mainContentArea && currentFile !== 'index.html' && currentFile !== '') {
        // Select <section> elements within <main> that have an ID
        const sectionsWithId = mainContentArea.querySelectorAll('section[id]');
        let hasHeadingsForToC = false;

        sectionsWithId.forEach(section => {
            const sectionId = section.id;
            // Find the first H2 immediately inside this section
            const heading = section.querySelector('h2');

            if (sectionId && heading && heading.textContent.trim() !== '') {
                hasHeadingsForToC = true;
                const listItem = document.createElement('li');
                const link = document.createElement('a');

                link.textContent = heading.textContent; // Text from H2
                link.href = `#${sectionId}`;          // Link to section's ID

                listItem.appendChild(link);
                tocList.appendChild(listItem);
            }
        });

        if (hasHeadingsForToC) {
            const pageH1 = mainContentArea.querySelector('h1');
            if (pageH1) {
                pageH1.parentNode.insertBefore(tocContainer, pageH1.nextSibling);
            } else {
                mainContentArea.insertBefore(tocContainer, mainContentArea.firstChild);
            }
        }
    }

    // --- 5. Basic Client-Side Search ---
    // This is a very simple search that highlights text within <section> tags.
    // It does NOT search headings in ToC or nav.
    const searchInput = document.createElement('input');
    searchInput.setAttribute('type', 'search');
    searchInput.setAttribute('id', 'cheatsheet-search');
    searchInput.setAttribute('placeholder', 'Search cheatsheet content...');

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('search-container');
    searchContainer.appendChild(searchInput);

    // Insert search bar after the navbar (if navbar exists)
    if (nav && nav.parentNode) {
        nav.parentNode.insertBefore(searchContainer, nav.nextSibling);
    } else if (document.body.firstChild) { // Fallback if no nav
        document.body.insertBefore(searchContainer, document.body.firstChild);
    }


    let originalSectionContents = new Map(); // To store original HTML for resetting search

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        const sections = document.querySelectorAll('main section'); // Search within main sections

        sections.forEach(section => {
            // Restore original content if it was stored
            if (originalSectionContents.has(section)) {
                section.innerHTML = originalSectionContents.get(section);
            }
            // Store original content before modifying for search
            if (searchTerm.length > 1 && !originalSectionContents.has(section)) {
                 originalSectionContents.set(section, section.innerHTML);
            }

            if (searchTerm.length > 1) { // Only search if term is reasonably long
                const textNodes = [];
                function getTextNodes(element) {
                    element.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                            textNodes.push(node);
                        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'PRE' && node.tagName !== 'CODE') {
                            // Don't search within pre/code blocks to avoid breaking them
                            getTextNodes(node);
                        }
                    });
                }
                getTextNodes(section);

                textNodes.forEach(textNode => {
                    const text = textNode.textContent;
                    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    if (regex.test(text)) {
                        const newNode = document.createElement('span'); // Use a span to avoid breaking parent structure
                        newNode.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                        textNode.parentNode.replaceChild(newNode, textNode);
                    }
                });
            } else if (searchTerm.length === 0 && originalSectionContents.size > 0) {
                // Clear highlights if search term is empty and there were previous highlights
                sections.forEach(s => {
                    if(originalSectionContents.has(s)) {
                        s.innerHTML = originalSectionContents.get(s);
                    }
                });
                originalSectionContents.clear();
            }
        });

        if (searchTerm.length === 0 && originalSectionContents.size > 0) {
            originalSectionContents.clear(); // ensure map is cleared
        }
    });
});