//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';

type Props = {
    foo: string;
}



class MyTable extends React.Component<Props, {}> {
    //table: String[][];
    constructor(props: Props) {
        super(props);
        //this.table = String[][];
    }
    public render() {

        return (
            <div>
                <h1>test</h1>

            </div>
        );
    }
}

export default MyTable;

/*type CardProps = {
    title: string,
    paragraph: string
}

export const Card = ({ title, paragraph }: CardProps) => <aside>
    <h2>{title}</h2>
    <p>
        {paragraph}
    </p>
</aside>

const el = <Card title="Welcome!" paragraph="To this example" />*/