let redirectGroups = [];

async function loadRedirectGroups() {
  const result = await chrome.storage.local.get('redirectGroups');
  redirectGroups = result.redirectGroups || [];
  displayRedirectGroups();
}

async function saveRedirectGroups() {
  await chrome.storage.local.set({ redirectGroups });
}

function displayRedirectGroups() {
  const container = document.getElementById('redirectGroups');
  container.innerHTML = '';

  redirectGroups.forEach((group, index) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'redirect-group';
    groupDiv.innerHTML = `
      <div class="group-header">
        <h3>Redirect Group ${index + 1}</h3>
        <button class="delete-group" data-index="${index}">
          <span class="material-icons">delete</span>
        </button>
      </div>
      <div class="input-container">
               <label>Source URLs (one per line):</label>
                <textarea class="source" data-index="${index}">${group.source.join('\n')}</textarea>
                <div class="regex-toggle">
                    <input type="checkbox" class="use-regex" data-index="${index}" ${group.useRegex ? 'checked' : ''}>
                    <label>Use Regular Expression</label>
                </div>
                <div class="help-text">
                    ${group.useRegex ? 
                        'Regular expression mode: Enter patterns to match URLs' :
                        'Exact match mode: Enter complete URLs (protocol optional)'}
                </div>
                <div class="help-text">
                    Examples:<br>
                    ${group.useRegex ? 
                        '- .*\\.example\\.com/.*<br>- ^https://.*\\.domain\\.com/page$' :
                        '- example.com/page<br>- https://subdomain.example.com/path'}
                </div>
            </div>
      <div class="input-container">
        <label>Target URL:</label>
        <input type="text" class="target" value="${group.target}" data-index="${index}">
        <div class="help-text">Enter the destination URL (including http:// or https://)</div>
      </div>
    `;
    container.appendChild(groupDiv);
  });

  // Add event listeners
  document.querySelectorAll('.source, .target').forEach(input => {
    input.addEventListener('change', updateGroup);
  });

  document.querySelectorAll('.use-regex').forEach(checkbox => {
    checkbox.addEventListener('change', updateRegexOption);
  });

  document.querySelectorAll('.delete-group').forEach(button => {
    button.addEventListener('click', deleteGroup);
  });
}

function addGroup() {
  redirectGroups.push({
    source: [''],
    target: '',
    useRegex: false
  });
  saveRedirectGroups();
  displayRedirectGroups();
}

function updateGroup(event) {
  const index = event.target.dataset.index;
  const field = event.target.className;
  
  if (field === 'source') {
    redirectGroups[index][field] = event.target.value.split('\n').filter(url => url.trim());
  } else {
    redirectGroups[index][field] = event.target.value;
  }
  
  saveRedirectGroups();
}

function updateRegexOption(event) {
  const index = event.target.dataset.index;
  redirectGroups[index].useRegex = event.target.checked;
  saveRedirectGroups();
}

function deleteGroup(event) {
  const index = event.target.closest('.delete-group').dataset.index;
  redirectGroups.splice(index, 1);
  saveRedirectGroups();
  displayRedirectGroups();
}

document.addEventListener('DOMContentLoaded', loadRedirectGroups);
document.getElementById('addGroup').addEventListener('click', addGroup);

function validateAndFormatUrls(urls, isRegex) {
    return urls.filter(url => url.trim()).map(url => {
        if (isRegex) return url.trim();
        
        let formattedUrl = url.trim();
        // Only format if it's not a regex pattern
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            // If no protocol is specified, we'll normalize it
            formattedUrl = formattedUrl.replace(/^www\./, '');
        }
        return formattedUrl;
    });
}

function updateGroup(event) {
    const index = event.target.dataset.index;
    const field = event.target.className;
    
    if (field === 'source') {
        const urls = event.target.value.split('\n');
        const isRegex = redirectGroups[index].useRegex;
        redirectGroups[index][field] = validateAndFormatUrls(urls, isRegex);
    } else {
        redirectGroups[index][field] = event.target.value;
    }
    
    saveRedirectGroups();
}

