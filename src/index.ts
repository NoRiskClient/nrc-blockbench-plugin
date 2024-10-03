import {monkeyPatch, revertPatches} from "./util";

(function() {
    function loadFileOverride(file: any, animation_filter: string[], originalFunction: Function) {
        let json = file.json || autoParseJSON(file.content);
        let new_anims = originalFunction.call(this, file, animation_filter)
        for(let theJ in json.animations) {
            let theFunny = new_anims.find((it: _Animation) => it.name === theJ)
            theFunny.disableVanillaAnims = json.animations[theJ]["lockVanillaBones"] || {}
            {
                let val = json.animations[theJ]["disableOnHit"]
                if (val != undefined) theFunny.disableOnHit = val
                else theFunny.disableOnHit = true
            }
            {
                let val = json.animations[theJ]["disableOnMove"]
                if (val != undefined) theFunny.disableOnMove = val
                else theFunny.disableOnMove = true
            }
            console.log(theJ, theFunny)
        }
        return new_anims
    }

    function saveFileEventHandler(eventData: any) {
        let anim = eventData.animation;
        let theJson = eventData.json;
        theJson["lockVanillaBones"] = anim.disableVanillaAnims || {}
        theJson["disableOnHit"] = anim.disableOnHit
        theJson["disableOnMove"] = anim.disableOnMove
        console.log("saved")
    }

    let theResizeHandler: Function;

    const allParts = [
        {id: "bipedRig", name: "Entire Body (disable yaw rotation)"},
        {id: "bipedHead", name: "Head"},
        {id: "bipedBody", name: "Torso"},
        {id: "bipedLeftArm", name: "Left Arm"},
        {id: "bipedRightArm", name: "Right Arm"},
        {id: "bipedLeftLeg", name: "Left Leg"},
        {id: "bipedRightLeg", name: "Right Leg"},
    ]

    BBPlugin.register("norisk_blockbench_plugin", {
        icon: "nothing",
        title: "NoRisk Plugin",
        about: "utils für Norisk client",
        description: "utils für Norisk client",
        author: "0x150, NoRisk",
        await_loading: true,
        tags: ["Minecraft", "Interface"],
        version: "1.0.0",
        variant: "both",
        onload() {
            monkeyPatch(Animator, "loadFile", loadFileOverride)
            Blockbench.addListener("compile_bedrock_animation", saveFileEventHandler)
            // @ts-ignore
            let guh: any = Interface.data.modes["animate"].panels
            if (!Object.keys(guh).includes("nr_bb_frozen_vanilla_bones")) guh["nr_bb_frozen_vanilla_bones"] = {}
            let panel = new Panel({
                default_side: "right", expand_button: false,
                id: "nr_bb_frozen_vanilla_bones",
                    name: "NoRisk",
                    icon: "fa-brush",
                    condition: {modes: ["animate"]},
                    default_position: {
                        slot: "right_bar",
                        float_position: [0, 0],
                        float_size: [300, 400],
                        height: 400,
                        folded: false
                    },
                    component: {
                        methods: {
                            setCA(anim: _Animation) {
                                if (anim) {
                                    //@ts-ignore
                                    if (!anim.disableVanillaAnims) anim.disableVanillaAnims = {}
                                    for (let allPart of allParts) {
                                        // @ts-ignore
                                        if (!Object.keys(anim.disableVanillaAnims).includes(allPart.id)) {
                                            // @ts-ignore
                                            anim.disableVanillaAnims[allPart.id] = false
                                        }
                                    }
                                    console.log("selected ", anim)
                                    for (let allPart of allParts) {
                                        let el = document.getElementById("bb_n_check_"+allPart.id)
                                        //@ts-ignore
                                        if (el) el.checked = anim.disableVanillaAnims[allPart.id];
                                    }
                                    let disableMove = document.getElementById("bb_disable_on_move");
                                    //@ts-ignore
                                    if (disableMove) disableMove.checked = anim.disableOnMove
                                    let disableHit = document.getElementById("bb_disable_on_hit");
                                    //@ts-ignore
                                    if (disableHit) disableHit.checked = anim.disableOnHit
                                } else {
                                    console.log("null")
                                }

                                this.currentAnim = anim
                            },
                            modifyDirty() {
                                let a: _Animation = this.currentAnim
                                a.saved = false
                            }
                        },
                        data() {
                            // @ts-ignore
                            let anim = Animation.selected;
                            return {
                                currentAnim: anim,
                                allParts
                            }
                        },
                        template: `
                   <div style="overflow-y: auto;">
                    <div v-if="currentAnim">
                        <p>Editing animation: {{currentAnim.name}}</p>
                        <div v-for="kk of allParts">
                            <input type="checkbox" :id="'bb_n_check_' + kk.id" v-model="currentAnim.disableVanillaAnims[kk.id]"
                            @change="modifyDirty()">
                            <label :for="'bb_n_check_' + kk.id">Freeze {{kk.name}}</label>
                        </div>
                        <div>
                            <input type="checkbox" :id="'bb_disable_on_hit'" v-model="currentAnim.disableOnHit" @change="modifyDirty()">
                            <label :for="'bb_disable_on_hit'">Stop animation on hit</label>
                        </div>
                        <div>
                            <input type="checkbox" :id="'bb_disable_on_move'" v-model="currentAnim.disableOnMove" @change="modifyDirty()">
                            <label :for="'bb_disable_on_move'">Stop animation on move</label>
                        </div>
                    </div>
                   </div>
                   `
                    }
                })
            //@ts-ignore
            Blockbench.addListener("resize_window", theResizeHandler = function(ev: any) {
                // @ts-ignore
                panel.vue.setCA(Animation.selected)
                console.log("resized")
            })
        },
        onunload() {
            revertPatches()
            Panels?.nr_bb_frozen_vanilla_bones?.delete();
            // @ts-ignore
            Blockbench.removeListener("compile_bedrock_animation", saveFileEventHandler)
            // @ts-ignore
            Blockbench.removeListener("resize_window", theResizeHandler)
        }
    })
})()
