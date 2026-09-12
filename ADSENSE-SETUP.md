# Cartoon Max AdSense setup

Publisher: `pub-7962627237294175`  
Client: `ca-pub-7962627237294175`  
Production host: `cartoon-max.netlify.app`

The integration uses the account verification meta tag, root `ads.txt`, and the standard Google Auto ads loader. No ad-unit slot IDs were supplied, so no manual ad units or fake ad placeholders have been added. Auto ads placement is configured in the AdSense account, not in this repository.

## Account steps still required

1. Add and verify the production site in AdSense using the meta tag or ads.txt. A raw GitHub/jsDelivr URL is not the production site.
2. Request site review and resolve any AdSense policy or content-quality issues. This integration does not establish account approval, site approval, copyright permissions, or eligibility.
3. Enable Auto ads for this site. Review the placement preview; exclude dialogs, player/navigation controls, and other unsuitable areas. Avoid disruptive overlay formats if preserving this UI.
4. Before serving ads to EEA, UK, or Swiss visitors, publish a Google-certified CMP message (for example through AdSense Privacy & messaging), and verify that it actually renders and sends valid consent signals. The local opt-in banner is NOT a Google-certified CMP and is NOT a substitute for this requirement. Additional jurisdiction-specific requirements must also be reviewed.
5. Review the privacy notice with the site operator's actual practices and applicable obligations before monetization. The current note is an implementation description, not a legal compliance certification.
6. Confirm the site's child-directed-content classification in AdSense. Blocking ads in a local child profile does not resolve site-wide classification requirements.

## Runtime behavior

- The AdSense script is loaded only on the exact production host after explicit opt-in and only in a non-child profile.
- It requests non-personalized ads. These can still use cookies and process technical data.
- Declining means the AdSense script is not loaded. Revoking a prior choice or switching to a child profile pauses requests and reloads to remove the third-party script context.
- No ad requests are made on localhost, deploy previews, jsDelivr, or githack. Update the host guard when a new approved domain is actually selected.
- Do not test by clicking live ads. Account and site approval status must be checked in AdSense itself.

## Publish

Publish these files together at the site root: `index.html`, `app.js`, `data1.js`, `data2.js`, `data3.js`, `adsense.js`, `adsense.css`, `ads.txt`, `privacy.html`.

Use the existing Netlify project `d79e1588-3136-4a21-b639-d8ee246e05da`. Verify the deployed root HTML contains the account meta tag, `/ads.txt` returns the exact publisher row, and all referenced scripts and styles return successfully. A deployment job being created does not prove the updated files are live.
