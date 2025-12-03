interface IOptions {
    failure_threshold: number;
    success_threshold: number;
    cooldown_time: number;
    action?: () => Promise<any>;
    fallback?: () => any;
    state?: 'OPEN' | 'CLOSED' | 'HALF-OPEN';
    timeout: number;
}

class circuit_breaker {
    failure_threshold: number;
    success_threshold: number;
    cooldown_time: number;
    action: any;
    fallback: any;
    state: IOptions['state'];
    failure_count: number;
    success_count: number;
    last_failure_time: null | number;
    next_attempt_time: null | number;
    timeout: number;

    constructor(options: IOptions) {
        this.failure_threshold = options.failure_threshold || 4;
        this.success_threshold = options.success_threshold || 3;
        this.cooldown_time = options.cooldown_time || 3000;
        this.action = options.action;
        this.fallback = options.fallback;
        this.timeout = options.timeout || 5000;
        this.state = options.state || "CLOSED";
        this.failure_count = 0;
        this.success_count = 0;
        this.last_failure_time = null;
        this.next_attempt_time = null;
    }

    transition_to_open() {
        this.state = "OPEN";
        this.last_failure_time = new Date().getTime();
        this.next_attempt_time = this.last_failure_time + this.cooldown_time;
        this.failure_count = 0;
    }

    transition_to_half_open() {
        this.state = "HALF-OPEN";
        this.success_count = 0;
    }

    transition_to_close() {
        this.state = "CLOSED";
        this.success_count = 0;
        this.failure_count = 0;
        this.last_failure_time = null;
        this.next_attempt_time = null;
    }

    async call(...args: any) {
        let res;
        console.log('GOT INSIDE CALL: ', this.state);
        if (this.state === "CLOSED") {
            try {
                res = await Promise.race([
                    this.action(...args),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout!')), this.timeout))
                ]);
            } catch (error) {
                this.failure_count++;
                console.log('GOT INSIDE CLOSED CATCH: ', this.failure_count);
                if (this.failure_count > this.failure_threshold) this.transition_to_open();
            }
        }

        if (this.state === "OPEN") {
            console.log('GOT INSIDE OPEN: ', this.next_attempt_time! <= new Date().getTime());
            if (this.next_attempt_time! <= new Date().getTime()) {
                console.log('GOT INSIDE OPEN TRANSITION TO HALF-OPEN');
                this.transition_to_half_open();
            } else {
                console.log('GOT INSIDE OPEN ELSE');
                return this.fallback ? this.fallback(...args) : Promise.reject(new Error("Circuit is open."));
            }
        }

        if (this.state === "HALF-OPEN") {
            console.log('GOT INSIDE HALF-OPEN');
            try {
                res = await Promise.race([
                    this.action(...args),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout!')), this.timeout))
                ]);
                this.success_count++;

                if (this.success_count >= this.success_threshold) {
                    this.transition_to_close();
                }
            } catch (error) {
                this.failure_count++;

                if (this.failure_count > this.failure_threshold) this.transition_to_open();
            }
        }

        return res;
    }
}

const circuit = new circuit_breaker({
    failure_threshold: 4,
    success_threshold: 3,
    cooldown_time: 3000,
    timeout: 5000,
    action: async () => {
        const response = await fetch('https://api.example.com/data');
        return response.json();
    },
    fallback: () => ({ message: "Fallback: service down" })
});

const execute = async () => {
    for (let i = 0; i < 7; i++) {
        const res = await circuit.call();
        console.log(`[${circuit.state}]`, res);
    }
};

execute();