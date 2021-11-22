export async function simple_activity(name: string): Promise<string> {
    return `Goodbye!! , ${name}!`
}

export async function complex_activity() {
    console.log("IN COMPLEX!!")
    return
}