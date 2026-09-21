const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const HOST_NAME = '127.0.0.1'
const PORT = 8060

const PAGES_DIR = path.join(__dirname, 'pages')
const DB_PATH = path.join(__dirname, 'database', 'db.json')

if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), {recursive: true})
    fs.writeFileSync(DB_PATH, '[]', {encoding: 'utf-8'})
}

const server = http.createServer((request, response) => {
    const [urlPath, query] = request.url.split('?')
    
    if (request.method === 'GET') {
        switch (urlPath) {
            case '/new-user':
                const queryObj = {}
                query.split('&').forEach(str => {
                    const [queryName, queryVal] = str.split('=')
                    queryObj[queryName] = queryVal
                })

                const name = queryObj.name
                const email = queryObj.email

                const user = {name, email}
                const dbJson = fs.readFileSync(DB_PATH)
                const users = JSON.parse(dbJson)
                user.id = users.length + 1
                users.push(user)
                fs.writeFileSync(DB_PATH, JSON.stringify(users))
                response.writeHead(200, {'Content-Type': 'text/plain'})
                response.end('User Added')
            break

            case '/find-user':
                const findUserPath = path.join(PAGES_DIR, 'form.html')
                fs.readFile(findUserPath, (err, findUserPage) => {
                    if (err) {
                        response.writeHead(500, {'Content-Type': 'text/plain'})
                        response.end('Internal Server Error')
                    } else {
                        response.writeHead(200, {'Content-Type': 'text/html'})
                        response.end(findUserPage)
                    }
                })
            break

            case '/css/style.css':
                const cssPath = path.join(__dirname, 'css', 'style.css')
                fs.readFile(cssPath, (err, cssFile) => {
                    if (err) {
                        response.writeHead(500, {'Content-Type': 'text/plain'})
                        response.end('Internal Server Error')
                    } else {
                        response.writeHead(200, {'Content-Type': 'text/css'})
                        response.end(cssFile)
                    }
                    
                })
            break
        }
    } else if (request.method === 'POST') {
        if (request.url === '/find-user') {
            let body = ''

            request.on('data', (chunk) => {
                body += chunk.toString()
            })

            request.on('end', () => {
                const parseBody = new URLSearchParams(body)

                const searchBy = parseBody.get('searchBy')
                const searchValue = parseBody.get('searchValue')

                const dbJson = fs.readFileSync(DB_PATH)
                const users = JSON.parse(dbJson)

                const user = users.find(user => String(user[searchBy]) === searchValue)

                if (!user) {
                    response.writeHead(404, {'Content-Type': 'text/plain'})
                    return response.end('User not found')
                }

                response.writeHead(200, {'Content-Type': 'application/json'})
                response.end(JSON.stringify(user))
            })
        }
    }
})

server.listen(PORT, HOST_NAME, () => {
    console.log(`server running at http://${HOST_NAME}:${PORT}/`)
})