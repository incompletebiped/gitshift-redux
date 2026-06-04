import * as vscode from 'vscode';

/**
 * Provides the webview content for the Support tab
 */
export class SupportProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlContent();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'openExternal':
          if (data.url) {
            await vscode.env.openExternal(vscode.Uri.parse(data.url));
          }
          break;
      }
    });
  }

  public refresh() {
    if (this._view) {
      this._view.webview.html = this._getHtmlContent();
    }
  }

  private _getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support GitShift</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: transparent;
      color: var(--vscode-foreground);
      padding: clamp(8px, 2.5vw, 16px);
      font-size: clamp(12px, 3vw, 13px);
      line-height: 1.5;
    }

    .donation-section {
      padding: clamp(12px, 3vw, 16px);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      text-align: center;
    }

    .donation-section h4 {
      font-size: clamp(11px, 2.8vw, 13px);
      font-weight: 600;
      margin-bottom: clamp(4px, 1vw, 8px);
      color: var(--vscode-foreground);
      letter-spacing: 0.3px;
    }

    .donation-section p {
      font-size: clamp(9px, 2.3vw, 10px);
      color: var(--vscode-descriptionForeground);
      margin-bottom: clamp(12px, 3vw, 16px);
      line-height: 1.4;
    }

    .donation-grid {
      display: flex;
      gap: clamp(8px, 2vw, 12px);
      justify-content: center;
      flex-wrap: wrap;
    }

    .donor-card {
      flex: 1;
      min-width: 80px;
      max-width: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .donor-label {
      font-size: clamp(8px, 2vw, 9px);
      color: var(--vscode-descriptionForeground);
      text-align: center;
      line-height: 1.3;
    }

    .donor-name {
      font-size: clamp(9px, 2.2vw, 10px);
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .donation-link {
      display: inline-block;
      transition: transform 0.2s ease, opacity 0.2s ease;
      width: 100%;
    }

    .donation-link:hover {
      transform: translateY(-2px);
      opacity: 0.9;
    }

    .donation-link img {
      height: clamp(28px, 7vw, 36px);
      border-radius: 4px;
      width: 100%;
      object-fit: contain;
    }

    .divider {
      width: 1px;
      background: rgba(255, 255, 255, 0.08);
      align-self: stretch;
      margin: 4px 0;
    }

    @media (max-width: 180px) {
      .donation-grid {
        flex-direction: column;
        align-items: center;
      }
      .divider { display: none; }
      .donor-card { max-width: 100%; width: 100%; }
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
    ::-webkit-scrollbar-thumb:active { background: var(--vscode-scrollbarSlider-activeBackground); }
    * { scrollbar-width: thin; scrollbar-color: var(--vscode-scrollbarSlider-background) transparent; }
  </style>
</head>
<body>
  <div class="donation-section">
    <h4>Support GitShift x GitShift Redux</h4>
    <p>If this extension is useful, consider supporting the devs behind it!</p>
    <div class="donation-grid">
      <div class="donor-card">
        <div class="donor-name">mikeeeyy04</div>
        <div class="donor-label">Original GitShift</div>
        <a href="https://www.buymeacoffee.com/mikeeeyy" class="donation-link" onclick="openDonation(event, 'https://www.buymeacoffee.com/mikeeeyy')">
          <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy mikeeeyy04 a coffee" />
        </a>
      </div>
      <div class="divider"></div>
      <div class="donor-card">
        <div class="donor-name">incompletebiped</div>
        <div class="donor-label">GitShift Redux</div>
        <a href="https://www.buymeacoffee.com/incompletebiped" class="donation-link" onclick="openDonation(event, 'https://www.buymeacoffee.com/incompletebiped')">
          <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy incompletebiped a coffee" />
        </a>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function openDonation(event, url) {
      event.preventDefault();
      vscode.postMessage({ type: 'openExternal', url });
    }
  </script>
</body>
</html>`;
  }
}

