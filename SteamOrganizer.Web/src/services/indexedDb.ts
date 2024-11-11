const DB_NAME = 'sodb';

export const enum EDbStore {
    User,
    Games,
    Friends,
}

let dbConnection : IDBDatabase | undefined;

function dbAction(mode: IDBTransactionMode, storeName: EDbStore, action: (store: IDBObjectStore) => IDBRequest) {
    return new Promise((resolve,reject) => {
        if(!dbConnection) {
            reject("No connection")
            return
        }
        const name = storeName === EDbStore.User ? 'user' : storeName === EDbStore.Games ? 'games' : 'friends'
        const store = dbConnection.transaction( name, mode ).objectStore(name);
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

        dbOpenRequest.onblocked =() => {
            reject('Database blocked')
        }

        dbOpenRequest.onupgradeneeded = function () {
            const db = dbOpenRequest.result;
            db.createObjectStore( 'user');
            db.createObjectStore('games');
            db.createObjectStore('friends');
        };
    })
}

function closeConnection() {
    dbConnection?.close()
    dbConnection = undefined
}

const save = (data: any, key: IDBValidKey, store: EDbStore = EDbStore.User) => {
    return dbAction('readwrite',store, (s) => s.put(data,key))
}

const remove = (key: IDBValidKey, store: EDbStore = EDbStore.User) => {
    return dbAction('readwrite',store, (s) => s.delete(key))
}

const get = <T>(key: IDBValidKey, store: EDbStore = EDbStore.User) => {
    return dbAction('readonly',store, (s) => s.get(key)) as Promise<T | undefined>
}

export default { get, remove, save, closeConnection, openConnection }


