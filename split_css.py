import re
import os

with open('web/css/pages.css', 'r') as f:
    content = f.read()

# Define the sections
sections = {
    'home.css': r'/\* ----- HOME.*?/\* ----- LOGIN & REGISTER',
    'auth.css': r'/\* ----- LOGIN & REGISTER.*?/\* ----- EMERGENCY',
    'emergency.css': r'/\* ----- EMERGENCY.*?/\* ----- SERVICES LIST',
    'services.css': r'/\* ----- SERVICES LIST.*?/\* ----- SERVICE DETAIL',
    'service-detail.css': r'/\* ----- SERVICE DETAIL.*?/\* ----- PROFILE DASHBOARD',
    'profile.css': r'/\* ----- PROFILE DASHBOARD.*?/\* ----- PROVIDER SIGNUP PAGE',
    'provider-register.css': r'/\* ----- PROVIDER SIGNUP PAGE.*?/\* ----- SETTINGS / SECURITY',
    'settings.css': r'/\* ----- SETTINGS / SECURITY.*?/\* ----- RESPONSIVE',
}

# Media queries
media_queries = {
    'home.css': ['.hero-grid,', '.cta-banner,', '.service-cards {', '  .hero-grid,', '  .cta-banner {', '    grid-template-columns: 1fr;'],
    'provider-register.css': ['.provider-hero {'],
    'service-detail.css': ['.detail-layout {'],
    'settings.css': ['.settings-grid {'],
    'services.css': ['.filter-bar {'],
    'profile.css': ['.profile-stats {']
}

os.makedirs('web/css/pages', exist_ok=True)

for filename, pattern in sections.items():
    match = re.search(pattern, content, re.DOTALL)
    if match:
        css_text = match.group(0).rsplit('/*', 1)[0].strip()
        
        # Add media queries if any
        if filename in media_queries:
            mq_text = "\n\n@media (max-width: 900px) {\n"
            if filename == 'home.css':
                mq_text += "  .hero-grid,\n  .cta-banner {\n    grid-template-columns: 1fr;\n  }\n  .service-cards {\n    grid-template-columns: 1fr;\n  }\n"
            elif filename == 'provider-register.css':
                mq_text += "  .provider-hero {\n    grid-template-columns: 1fr;\n  }\n"
            elif filename == 'service-detail.css':
                mq_text += "  .detail-layout {\n    grid-template-columns: 1fr;\n  }\n"
            elif filename == 'settings.css':
                mq_text += "  .settings-grid {\n    grid-template-columns: 1fr;\n  }\n"
            elif filename == 'services.css':
                mq_text += "  .filter-bar {\n    grid-template-columns: 1fr;\n  }\n"
            elif filename == 'profile.css':
                mq_text += "  .profile-stats {\n    grid-template-columns: 1fr;\n  }\n"
            mq_text += "}\n"
            css_text += mq_text
            
        with open(f'web/css/pages/{filename}', 'w') as f:
            f.write(css_text + '\n')

# Create the new pages.css
new_pages_css = """/**
 * =============================================================================
 * pages.css — Index for all page-specific styles
 * =============================================================================
 * We refactored this file to separate concerns. Each page now has its own CSS
 * file in the /css/pages/ directory. This makes maintenance much easier.
 * =============================================================================
 */

@import url("pages/home.css");
@import url("pages/auth.css");
@import url("pages/emergency.css");
@import url("pages/services.css");
@import url("pages/service-detail.css");
@import url("pages/profile.css");
@import url("pages/provider-register.css");
@import url("pages/settings.css");
"""

with open('web/css/pages.css', 'w') as f:
    f.write(new_pages_css)

print("Refactoring complete.")
