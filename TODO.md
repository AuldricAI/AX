# AX Open Source Contribution TODOs

Welcome to the AX repository! We are always looking for contributors to help improve the project. If you're looking for something to work on, here are a few areas where we need help:

## UI / UX Enhancements
- **Popup Design Polish**: Improve the padding, margins, and overall alignment within the extension popup to make it feel more cohesive and modern.
- **Micro-interactions**: Add subtle hover and click animations to buttons and tabs in the popup.
- **Loading States**: Improve skeleton loaders or loading spinners when fetching history or capturing diagnostics.
- **Empty States**: Create beautiful graphic empty states for the History tab when no runs have been performed yet.

## Features
- **Settings Sync**: Allow users to optionally sync their API keys securely via their browser profile.
- **Customizable Prompts**: Let users edit the exact prompt template that is copied to the clipboard.
- **History Export**: Provide an option to export the entire run history as a JSON or CSV file.

## Performance & Infrastructure
- **Tests**: Add unit tests for the prompt engineering and generation logic (`src/lib/prompts.ts`).
- **E2E Testing**: Add basic end-to-end tests for the popup UI using Playwright or Puppeteer.

If you have other ideas, feel free to open an issue or submit a PR!
