let endpoint = '/api/analyze';
if (mode === 'advanced') endpoint += '/advanced';
else if (mode === 'freeplay') endpoint += '/freeplay';
else if (mode === 'basic_freeplay') endpoint += '/basic-freeplay'; 