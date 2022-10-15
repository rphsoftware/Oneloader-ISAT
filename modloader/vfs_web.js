function _modLoader_install_debugger_vfs(shadowfs, nativefs) {
    $modLoader.$log("[VFS_WEB] Starting HTTP server");

    function readRangeHeader(range, totalLength) {
        /*
         * Example of the method 'split' with regular expression.
         * 
         * Input: bytes=100-200
         * Output: [null, 100, 200, null]
         * 
         * Input: bytes=-200
         * Output: [null, null, 200, null]
         */

        if (range == null || range.length == 0)
            return null;

        var array = range.split(/bytes=([0-9]*)-([0-9]*)/);
        var start = parseInt(array[1]);
        var end = parseInt(array[2]);
        var result = {
            Start: isNaN(start) ? 0 : start,
            End: isNaN(end) ? (totalLength - 1) : end
        };
        
        if (!isNaN(start) && isNaN(end)) {
            result.Start = start;
            result.End = totalLength - 1;
        }

        if (isNaN(start) && !isNaN(end)) {
            result.Start = totalLength - end;
            result.End = totalLength - 1;
        }

        return result;
    }

    let SERVER_KEY = require('crypto').randomBytes(32).toString('hex');
    let TEST_KEY   = require('crypto').randomBytes(32).toString('hex');
    let testKeyChecker;
    const path = require('path');
    const base = path.dirname(process.mainModule.filename);
    const urlTester = new RegExp(`^/${SERVER_KEY}`);
    async function requestListener(req, res) {
        try {
            res.setHeader("Accept-Ranges", "bytes");
            if (req.url === `/${SERVER_KEY}/${TEST_KEY}`) {
                res.setHeader("Content-Type", "application/json");
                res.writeHead(200);
                res.end('{"ready": true}');
            
                $modLoader.$vfsTrace(`[VFS_WEB] ${TEST_KEY}`);
                $modLoader.$log(`[VFS_WEB] Got Test key. Successfully authenticated client.`);
                
                return;
            }

            if (!urlTester.test(req.url)) {
                res.writeHead(400);
                res.end('Server key not present!');

                $modLoader.$vfsTrace(`[VFS_WEB] Unauthorized request to VFS! Path: ${req.url}`);

                return;
            }
            
            let requestPath = req.url.split(new RegExp(`^/${SERVER_KEY}`))[1];
            if (requestPath.startsWith("/www/")) {
                requestPath = requestPath.replace(/^\/www/, "");
            }

            try {
                const data = await _vfs_resolve_file(requestPath);

                let ext = requestPath.match(/\.([^\.]*)$/)[1];

                let type = Mime.getType(ext);

                res.setHeader("Content-Type", type);
                res.setHeader("Access-Control-Allow-Origin", window.location.origin);


                let rangeRequest = readRangeHeader(req.headers["range"], data.length);
                if (rangeRequest == null) {
                    res.setHeader("Content-Length", data.length);
                    res.writeHead(200);
                    res.end(data);
                } else {
                    res.setHeader("Content-Range", "bytes " + rangeRequest.Start + "-" + rangeRequest.End + "/" + data.length);
                    res.setHeader("Content-Length", (
                        rangeRequest.End - rangeRequest.Start + 1
                    ));
                    res.writeHead(206);

                    res.end(data.subarray(rangeRequest.Start, rangeRequest.End + 1));
                }
                
                $modLoader.$vfsTrace(`[VFS_WEB] Got request ${req.url} (${requestPath})`);
            } catch(E) {
                console.log(E);
                res.writeHead(404);
                res.end('');
            }
        } catch(E) {
            console.log(E);
        }
    }

    return new Promise(async (resolve, reject) => {
        const [server, port] = await new Promise((listening, _) => {
            const http = require('http');
    
            let server = http.createServer(requestListener);
            
            server.listen(0, "127.0.0.1", undefined, () => void listening([server, server.address().port]));
        });

        $modLoader.$log(`[VFS_WEB] Proxy server listening on Port 127.0.0.1:${port}`);

        function beforeRequestInterceptor(details) {
            let u = new URL(details.url);
            if (u.pathname === "/www/modloader/one_loader_sw.js") return null;
            return {redirectUrl: `http://127.0.0.1:${port}/${SERVER_KEY}${u.pathname}`}
        }

        chrome.webRequest.onBeforeRequest.addListener(beforeRequestInterceptor, {
            urls: [ 
                window.location.origin + "/www/*",
                window.location.origin + "/" + TEST_KEY
            ]
        }, ["blocking"])

        window.addEventListener("beforeunload", function(e) {
            chrome.webRequest.onBeforeRequest.removeListener(beforeRequestInterceptor);
            server.close();
        });
    
        testKeyChecker = setInterval(() => {
            fetch(`/${TEST_KEY}`).then(a => a.json()).then(a => {
                if (a && a.ready === true) {
                    console.log("test key done");
                    resolve();
                    clearInterval(testKeyChecker);
                }
            }).catch(e => {});
        }, 100);
    });
}