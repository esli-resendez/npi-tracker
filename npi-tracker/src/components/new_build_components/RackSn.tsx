import {
    Button,
    Input,
    Label
} from "@fluentui/react-components";

import type {
    BuildData
} from "../../models/BuildData";

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

        setBuildData(current => ({
            ...current,
            racks: [
                ...current.racks,
                {
                    rackSerial: ""
                }
            ]
        }));
    };

    const removeRack = (
        index: number
    ) => {

        setBuildData(current => ({

            ...current,

            racks: current.racks.filter(
                (_, rackIndex) =>
                    rackIndex !== index
            )
        }));
    };

    return (

        <div>

            <h2>
                Rack Serial Numbers
            </h2>

            {
                buildData.racks.map(
                    (rack, index) => (

                        <div
                            key={index}
                            style={{
                                display: "flex",
                                gap: "10px",
                                marginBottom: "10px",
                                alignItems: "center"
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection:
                                        "column",
                                    flexGrow: 1
                                }}
                            >

                                <Label>
                                    Rack Serial
                                    {" "}
                                    {index + 1}
                                </Label>

                                <Input
                                    value={
                                        rack.rackSerial
                                    }

                                    onChange={(
                                        _,
                                        data
                                    ) =>
                                        updateRackSerial(
                                            index,
                                            data.value
                                        )
                                    }
                                />

                            </div>

                            <Button
                                appearance="secondary"

                                onClick={() =>
                                    removeRack(
                                        index
                                    )
                                }
                            >
                                -
                            </Button>

                        </div>
                    )
                )
            }

            <Button
                appearance="primary"
                onClick={addRack}
            >
                +
            </Button>

        </div>
    );
}