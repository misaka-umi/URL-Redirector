// Utility function to normalize URLs
function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);
        // Remove trailing slash and convert to lowercase
        return urlObj.toString()
            .toLowerCase()
            .replace(/\/$/, '')  // Remove trailing slash
            .replace(/^https?:\/\//, '') // Remove protocol
            .replace(/^www\./, '');  // Remove www.
    } catch (e) {
        return url.toLowerCase().trim();
    }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return;

    const result = await chrome.storage.local.get('redirectGroups');
    const redirectGroups = result.redirectGroups || [];

    for (const group of redirectGroups) {
        if (!group.source.length || !group.target) continue;

        const currentUrl = details.url;
        let shouldRedirect = false;

        if (group.useRegex) {
            // Regex mode - keep existing regex matching
            for (const sourcePattern of group.source) {
                try {
                    const regex = new RegExp(sourcePattern);
                    if (regex.test(currentUrl)) {
                        shouldRedirect = true;
                        break;
                    }
                } catch (e) {
                    console.error('Invalid regex pattern:', sourcePattern);
                }
            }
        } else {
            // Exact URL matching mode
            const normalizedCurrentUrl = normalizeUrl(currentUrl);
            shouldRedirect = group.source.some(sourceUrl => {
                const normalizedSourceUrl = normalizeUrl(sourceUrl.trim());
                return normalizedCurrentUrl === normalizedSourceUrl;
            });
        }

        if (shouldRedirect) {
            chrome.tabs.update(details.tabId, { url: group.target });
            break;
        }
    }
});