export class PriorityQueue<T> {
    private elements: { element: T; priority: number }[] = [];

    enqueue(element: T, priority: number): void {
        let contains = false;
        for (let i = 0; i < this.elements.length; i++) {
            if (this.elements[i].priority > priority) {
                this.elements.splice(i, 0, { element, priority });
                contains = true;
                break;
            }
        }

        if (!contains) {
            this.elements.push({ element, priority });
        }
    }

    dequeue(): { element: T; priority: number } | undefined {
        if (!this.isEmpty()) {
            return this.elements.shift();
        }
    }

    isEmpty(): boolean {
        return this.elements.length === 0;
    }
}
