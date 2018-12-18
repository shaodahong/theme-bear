import React from 'react'

import Select from './select'

export default class Index extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      code: 1001
    }
  }
  async componentDidMount() {
    const { lists } = await getApi()

    this.setState({
      lisst
    })
  }
  render() {
    const params = {
      name: 'select',
      active: true
    }
    return (
      <div className="index">
        <button className="button-index">text</button>
        {this.state.isShow === 1003 && <Select {...parmas} isShow />}
        {lists.map((list, index) => (
          <p key={index}>list</p>
        ))}
      </div>
    )
  }
}
