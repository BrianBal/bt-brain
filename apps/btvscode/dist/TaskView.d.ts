import { WebviewPanel, Uri } from 'vscode';

export default class TaskView {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    static currentPanel: TaskView | undefined;
    static readonly viewType = "taskView";
    private readonly _panel;
    private readonly _extensionUri;
    private _disposables;
    private _session;
    private _templates;
    static createOrShow(extensionUri: Uri): void;
    static revive(panel: WebviewPanel, extensionUri: Uri): void;
    private constructor();
    doRefactor(): void;
    dispose(): void;
    private _update;
    private _updateWithName;
    private _getHtmlForWebview;
}
