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
console.log('ToC Script: Starting ToC generation...'); // DEBUG

const tocContainer = document.createElement('aside');
tocContainer.id = 'toc-container';
const tocList = document.createElement('ul');
tocList.id = 'toc-list';
const tocTitle = document.createElement('h3');
tocTitle.textContent = 'Table of Contents';
tocContainer.appendChild(tocTitle);
tocContainer.appendChild(tocList);

const mainContentArea = document.querySelector('main');
console.log('ToC Script: mainContentArea found?', mainContentArea); // DEBUG

const currentFile = window.location.pathname.split('/').pop();
console.log('ToC Script: currentFile is', currentFile); // DEBUG

if (mainContentArea && currentFile !== 'index.html' && currentFile !== '') {
    console.log('ToC Script: Conditions met to proceed with ToC for this page.'); // DEBUG

    const headings = mainContentArea.querySelectorAll('section > h2[id]');
    console.log('ToC Script: Found headings for ToC:', headings.length, headings); // DEBUG
    let hasHeadingsForToC = false;

    headings.forEach(heading => {
        if (heading.id && heading.textContent.trim() !== '') {
            hasHeadingsForToC = true;
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.textContent = heading.textContent;
            link.href = `#${heading.id}`;
            listItem.appendChild(link);
            tocList.appendChild(listItem);
            console.log('ToC Script: Added to ToC list:', heading.textContent); // DEBUG
        } else {
            console.log('ToC Script: Skipped heading (no id or empty text):', heading); // DEBUG
        }
    });

    if (hasHeadingsForToC) {
        console.log('ToC Script: hasHeadingsForToC is true. Attempting to insert ToC.'); // DEBUG
        const pageH1 = mainContentArea.querySelector('h1');
        console.log('ToC Script: pageH1 found?', pageH1); // DEBUG

        if (pageH1) {
            console.log('ToC Script: Inserting ToC after H1.'); // DEBUG
            pageH1.parentNode.insertBefore(tocContainer, pageH1.nextSibling);
        } else {
            console.warn('ToC Script: No H1 found within main. ToC not inserted optimally.'); // DEBUG
            // Fallback: Insert at the beginning of main if H1 isn't found
            // mainContentArea.insertBefore(tocContainer, mainContentArea.firstChild);
        }
    } else {
        console.log('ToC Script: No valid headings found for ToC. ToC not created.'); // DEBUG
    }
} else {
    console.log('ToC Script: Conditions NOT met for ToC on this page (either no main area or it is index.html).'); // DEBUG
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