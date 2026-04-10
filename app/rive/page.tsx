'use client'
import {
    useRive,
    Layout,
    Fit,
    Alignment,
    useViewModelInstanceNumber,
    useViewModel,
    useViewModelInstance,
} from "@rive-app/react-webgl2";

export default function RivePage() {
    const { rive, RiveComponent } = useRive({
        src: "man.riv",
        stateMachines: "Motion",
        autoplay: true,
        autoBind: true,
        layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
        }),
    });

    const viewModel = useViewModel(rive, { name: "Character" });
    const vmi = useViewModelInstance(viewModel, { rive });
    // The numSkin property controls which Solo is displayed.
    const { value, setValue } = useViewModelInstanceNumber("numSkin", vmi);
    return (
        <div className="w-full flex flex-col justify-center items-center gap-6 min-h-screen mx-auto" >
            <button
                onClick={() => setValue(value! + 1)}
                className="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer px-4 py-2 rounded-lg"
            >Change Skin</button>
            <RiveComponent

                style={{ height: '500px', width: '500px' }}
            />
        </div>
    );
}