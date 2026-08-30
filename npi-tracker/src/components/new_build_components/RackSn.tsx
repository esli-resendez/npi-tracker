import {
    Button,
    Input,
    Label
} from "@fluentui/react-components";

import type {BuildData} from "../../models/BuildData";
import '../../styles/App.css';

interface RackSnProps {
    buildData: BuildData;
    setBuildData:
        React.Dispatch<
            React.SetStateAction<BuildData>
        >;
}

export default function RackSn({
    buildData,
    setBuildData
}: RackSnProps) {

    const updateRackSerial = (
        index: number,
        value: string
    ) => {

        setBuildData(current => ({...current,
            racks: current.racks.map(
                (rack, rackIndex) =>
                    rackIndex === index
                        ? {
                            ...rack,
                            rackSerial: value
                        }
                        : rack
            )
        }));
    };

    const addRack = () => {
        // Limit user to manual inputs to 5 racks 
        if (buildData.racks.length >= 5){
            console.log("Manual entry is limited to 5 rack tracking");
            return;
        }
        setBuildData(current => ({ ...current,
                racks: [...current.racks, {rackSerial: ""}
            ]
        }));
    };

    const removeRack = (index: number) => {
        setBuildData(current => ({...current,
            racks: current.racks.filter((_, rackIndex) => rackIndex !== index )
        }));
    };

    return (
        <div id="racksn_capture_main">
            <h2 id="r_h2" className="head-2">Capture up to 5 Rack Serial Numbers</h2>
            {
                buildData.racks.map((rack, index) => (
                        <div key={index} className="racksn-index">
                            <div className="racksn-item">
                                <Label>Rack Serial {" "}{index + 1}</Label>
                                <Input value={rack.rackSerial}
                                    onChange={(event) => updateRackSerial(index, event.target.value)}
                                    className="f-ui-input"/>
                            </div>
                            <Button appearance="secondary"
                                onClick={() => removeRack(index)}>
                                -
                            </Button>
                        </div>
                    ))}

            <Button id="addrack_btn"
            disabled={buildData.racks.length >= 5 } 
            appearance="primary" onClick={addRack}>+</Button>
        </div>
    );
}