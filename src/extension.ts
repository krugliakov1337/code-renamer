// @ts-nocheck
import * as vscode from 'vscode';

const splitToWords = (text: string): string[] => {
    return text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[_\-\s]+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .filter((word: string) => word.length > 0);
};

const converters: { [key: string]: (words: string[]) => string } = {
    camelCase: (w: string[]): string =>
        w.map((x: string, i: number) => (i === 0 ? x : x[0].toUpperCase() + x.slice(1))).join(''),
    snake_case: (w: string[]): string =>
        w.join('_'),
    PascalCase: (w: string[]): string =>
        w.map((x: string) => x[0].toUpperCase() + x.slice(1)).join(''),
    UPPER_SNAKE_CASE: (w: string[]): string =>
        w.join('_').toUpperCase(),
    'kebab-case': (w: string[]): string =>
        w.join('-'),
};

export function activate(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand('codestyle.changeCase', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const doc = editor.document;
        const ranges: vscode.Range[] = [];

        for (const sel of editor.selections) {
            const range = sel.isEmpty ? doc.getWordRangeAtPosition(sel.active) : sel;
            if (range) {
                ranges.push(range);
            }
        }

        if (ranges.length === 0) {
            return;
        }

        const sampleWords = splitToWords(doc.getText(ranges[0]));
        if (sampleWords.length === 0) {
            return;
        }

        const items: vscode.QuickPickItem[] = Object.keys(converters).map((label: string) => ({
            label,
            description: converters[label](sampleWords),
        }));

        const picked = await vscode.window.showQuickPick(items, {
            placeHolder: 'Выбери новый кодстайл переменной',
        });

        if (!picked) {
            return;
        }

        const convertFn = converters[picked.label];

        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            for (const range of ranges) {
                const words = splitToWords(doc.getText(range));
                if (words.length > 0) {
                    editBuilder.replace(range, convertFn(words));
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate(): void {}