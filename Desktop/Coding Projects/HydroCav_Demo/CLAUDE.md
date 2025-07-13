# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple HTML demonstration page for HydroCav, showcasing their hydrodynamic cavitation water treatment technology. The project consists of a single static HTML file with embedded CSS and JavaScript.

## Development Setup

No build process or package manager required. Simply open the HTML file in a browser to view.

### Local Development
```bash
# Serve locally (Python)
python -m http.server 8000

# Serve locally (Node.js)
npx http-server .

# Open directly in browser
open HydroCav_Demo.html
```

## Technology Stack

- **HTML5**: Semantic markup with proper meta tags and accessibility
- **Tailwind CSS**: Via CDN (https://cdn.tailwindcss.com)
- **CSS3**: Custom animations and hover effects
- **JavaScript**: Vanilla JS for scroll animations and intersection observer
- **Google Fonts**: Inter and Playfair Display fonts

## Architecture

### Single-Page Structure
- Hero section with animated cavitation bubbles
- Technology explanation with benefits
- HydroLoop system features (3-card layout)
- Industry applications showcase
- Contact/CTA section
- Footer

### Key Features
- Responsive design (mobile-first)
- Smooth scroll navigation
- CSS animations (floating bubbles, hover effects)
- Intersection Observer for scroll-triggered animations
- Gradient backgrounds and custom styling

### Styling Approach
- Tailwind utility classes for layout and spacing
- Custom CSS for animations and branded elements
- Consistent color scheme (sky blues, slate grays)
- Card-based component design

## Contact Information
- Email: davet@hydrocav.com
- Phone: (772) 202-0071

## Code Conventions

When modifying this file:
- Maintain responsive design patterns
- Use Tailwind classes for styling consistency
- Keep custom CSS minimal and purposeful
- Preserve accessibility features (semantic HTML, alt tags)
- Test across mobile and desktop viewports