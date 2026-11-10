# ISO customer application domains

Customer entry point: https://lrqa-iso-application.netlify.app/

The original ISO 9001, 14001 and 45001 form remains on the customer site's home page. Its link opens the ISO 37001 and ISO 37301 form at `/compliance/`. The new page is a standalone React bundle and contains no internal portal pages or credentials.

Customer source: https://github.com/neod00/lrqa-iso-application

The customer source under `public-client/` includes the questionnaire, component and CSS. `npm run build` emits hashed browser assets and the entry page under `public/compliance/`. These sources are a snapshot of the portal's questionnaire component; coordinate future changes to both copies. Tests: `node --test tests/compliance-relay.test.cjs`.

The browser submits to its own site's `submit-compliance-application` Netlify function. This function only relays POST requests to the portal's existing create-only intake endpoint. It forwards neither cookies nor authentication and only returns a receipt reference or validation message. Existing private inbox storage and quote workflows stay on the portal site; customer-site Blob storage is not used for the new form.

The portal route `/iso/apply` redirects to the customer site's `/compliance/`. Portal `/iso`, inbox, documents and read APIs retain session protection. Do not move portal pages or templates into the customer deployment.
