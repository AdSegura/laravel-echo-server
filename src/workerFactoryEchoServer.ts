import {Starter} from "./start";

Starter.run({port:1111}).then(() => {
    console.log(`Server S1 Started!`);
});

Starter.run({port:2222}).then(() => {
    console.log(`Server S2 Started!`);
});
