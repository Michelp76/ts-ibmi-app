# Purpose
IBM sources and joblogs explorer : searches dds, sql, cl, rpgle programs sources, qezdebug dumps...  
And displays them in a nice syntax highlighter ([react-syntax-highlighter](https://github.com/react-syntax-highlighter "react-syntax-highlighter"))

![image](https://github.com/user-attachments/assets/ef1059c9-8cca-434c-9c11-2732549e656e)


Uses Typescript and [node-odbc](https://github.com/IBM/node-odbc "node-odbc") for the backend and Vite / ReactJs / Tailwind for the web goodies  
Internal search engine powered by [js-worker-search](https://github.com/bvaughn/js-worker-search "js-worker-search")

Be sure to check the provided `.env.example` :

```sql
PORT=3000
DB_HOST=XXX.XX.XX.XX
DB_ID=MYLOGIN
DB_PASSWORD=MYPASS
DB_DBQ=DEVPAIFILE # library containing dds, sql tables
DB_SRC=NETPAISRC  # library rpgle, cl programs
DB_FOLDERS="'QRPGLESRC','QCLPSRC','QRPGINCLU'" # folders of files to inspect (the more listed the less peformance of course)
DB_TABLE_OWNER=GRDEVSPAF # User profile/owner of the object(s)
DB_SWP_SRC_FILE=1 # could be very specific but useful at our shop : swap the given suffix ie. 'src' into 'file' (ie. devpaisrc -> devpaifile)
```

I haven't been able to test it against other IBMi systems (pub400.com was offline at the time) so hopefully it should work for you with as little modifications as possible

# How to launch

Backend :

```shell
cd .\server\
npm start
```

Frontend :

```shell
cd .\client\
pnpm run dev
```

Finally you can connect on http://localhost:5173/
