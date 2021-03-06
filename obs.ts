//add map to prototype next.
//http://jsbin.com/xavaga/2/edit?js,console,output
//https://medium.com/@benlesh/learning-observable-by-building-observable-d5da57405d87

export function run() {
    let x = map(myObservable, (x) => x * 3);

    x.subscribe({
        next: (v) => console.log(`in observer ${v}`),
        complete: () => console.log('complete')
    })
}

interface IObserver {
    next?(value: any): void;
    error?(error: any): void;
    complete?(): void;
}

class DataSource {
    _id: any;
    i: number;
    ondata: (n: number) => void;
    oncomplete: () => void;
    onerror: (error: any) => void;

    constructor() {
        let i = 0;
        this._id = setInterval(() => this.emit(i++), 200);
    }

    emit(n) {
        const limit = 10;
        if (this.ondata) {
            this.ondata(n);
        }
        if (n === limit) {
            if (this.oncomplete) {
                this.oncomplete();
            }
            this.destroy();
        }
    }

    destroy() {
        clearInterval(this._id);
    }
}

class SafeObserver {
    isUnsubscribed = false;
    unsub: UnsubscribeFunc;

    constructor(private destination: IObserver) {
    }

    next(value) {
        // only try to next if you're subscribed have a handler
        if (!this.isUnsubscribed && this.destination.next) {
            try {
                console.log(`so next ${value}`);
                this.destination.next(value);
            } catch (err) {
                // if the provided handler errors, teardown resources, then throw
                this.unsubscribe();
                throw err;
            }
        }
    }

    error(err) {
        // only try to emit error if you're subscribed and have a handler
        if (!this.isUnsubscribed && this.destination.error) {
            try {
                console.log(`so error ${err}`);
                this.destination.error(err);
            } catch (e2) {
                // if the provided handler errors, teardown resources, then throw
                this.unsubscribe();
                throw e2;
            }
            this.unsubscribe();
        }
    }

    complete() {
        // only try to emit completion if you're subscribed and have a handler
        if (!this.isUnsubscribed && this.destination.complete) {
            try {
                console.log(`so complete`);
                this.destination.complete();
            } catch (err) {
                // if the provided handler errors, teardown resources, then throw
                this.unsubscribe();
                throw err;
            }
            this.unsubscribe();
        }
    }

    unsubscribe() {
        this.isUnsubscribed = true;
        if (this.unsub) {
            this.unsub();
        }
    }
}

type UnsubscribeFunc = () => void;
type SubscribeFunc = (observer: IObserver) => UnsubscribeFunc;

/**
 * Observable basic implementation
 */
class Observable {
    constructor(private _subscribe: SubscribeFunc) {
    }

    subscribe(observer: IObserver) {
        const safeObserver = new SafeObserver(observer);
        safeObserver.unsub = this._subscribe(safeObserver);
        return safeObserver.unsubscribe.bind(safeObserver);
    }
}

const myObservable = new Observable((observer) => {
    const datasource = new DataSource();
    console.log('datasource created');
    datasource.ondata = (e) => observer.next(e);
    datasource.onerror = (err) => observer.error(err);
    datasource.oncomplete = () => observer.complete();

    return () => datasource.destroy();
});



function map<T>(source: Observable, project): Observable {
    return new Observable((observer) => {
        const mapObserver = {
            next: (x) => observer.next(project(x)),
            error: (err) => observer.error(err),
            complete: () => observer.complete()
        };
        return source.subscribe(mapObserver);
    });
}




