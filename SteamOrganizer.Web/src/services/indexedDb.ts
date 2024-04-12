const DB_NAME = 'sodb';

let dbConnection : IDBDatabase | undefined;

function dbAction(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest) {
    return new Promise((resolve,reject) => {
        if(!dbConnection) {
            reject("No connection")
            return
        }
        const store = dbConnection.transaction(  'user' , mode ).objectStore('user');
        const request = action(store)
        request.onsuccess = () => resolve( request.result );
        request.onerror = reject;
    })
}


function openConnection() {
    return new Promise<boolean>((resolve, reject) => {
        if(dbConnection) {
            resolve(true);
            return
        }

        if(!window.indexedDB) {
            reject("Indexed db not supported")
            return
        }

        const dbOpenRequest = indexedDB.open(DB_NAME, 1);

        dbOpenRequest.onsuccess = function() {
            dbConnection = dbOpenRequest.result;
            resolve(true)
        };

        dbOpenRequest.onerror = () => {
            reject('Error opening database');
        };

        dbOpenRequest.onupgradeneeded = function () {
            const db = dbOpenRequest.result;
            db.createObjectStore( 'user');
        };
    })
}

function closeConnection() {
    dbConnection?.close()
    dbConnection = undefined
}

const save = (data: any, key: IDBValidKey) => {
    return dbAction('readwrite',(store) => store.put(data,key))
}

const remove = (key: IDBValidKey) => {
    return dbAction('readwrite', (store) => store.delete(key))
}

const get = (key: IDBValidKey) => {
    return dbAction('readonly', (store) => store.get(key))
}

export default { get, remove, save, closeConnection, openConnection }


