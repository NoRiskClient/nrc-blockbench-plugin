const originals = new Map();
export function monkeyPatch(owner: any, name: string,
                     newFnc: Function) {
    let original = owner[name];
    function invoker() {
        newFnc(...arguments, original)
    }
    if (!originals.has(owner)) {
        originals.set(owner, [])
    }
    (originals.get(owner) || []).push({
        path: name,
        original: original
    })
    console.log(`Monkey-patched function ${name}`)
    owner[name] = invoker;
}

export function revertPatches() {
    for (let key of originals.keys()) {
        let meta = originals.get(key);
        for (let entry of meta) {
            key[entry.path] = entry.original
            console.log(`Unregistered monkey patch ${entry.path}`)
        }
    }
    originals.clear()
}