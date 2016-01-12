var PaymentSelector = React.createClass({displayName: 'PaymentSelector',
  handleSelection: function (e) {
    var paymentMethodKey = e.target.value,
        paymentMethods = this.props.paymentMethods;

    if (!paymentMethods.hasOwnProperty(paymentMethodKey)) {
      return;
    }

    this.props.onPaymentSelected(paymentMethods[paymentMethodKey]);
    e.target.value = "";
  },
  render: function () {
    var paymentMethods = this.props.paymentMethods,
        paymentMethodKeys = Object.keys(paymentMethods),
        paymentMethodOptions = paymentMethodKeys.map(function (paymentMethodKey) {
          var paymentMethod = paymentMethods[paymentMethodKey];
          return (
            <option value={paymentMethodKey} key={paymentMethodKey}>{paymentMethod.description}</option>
          );
        });
    return (
      <select onChange={this.handleSelection}>
        <option value="">Select Payment</option>
        {paymentMethodOptions}
        <option value="giftcard-scheme">Add New Gift Card</option>
        <option value="creditcard-scheme">Add New Credit Card</option>
      </select>
    );
  }
});

var PaymentTipForm = React.createClass({displayName: 'PaymentTipForm',
  render: function () {
    return (
      <div>
        <hr />
        <h2>Add Tip</h2>
        <PaymentSelector paymentMethods={this.props.tipMethods} />
      </div>
    );
  }
});

var PaymentMethodItem = React.createClass({displayName: 'PaymentMethodItem',
  handleAmountChange: function (e) {
    this.props.handleAmountChange(e);
  },
  handleRemovePayment: function (e) {
    this.props.handleRemovePayment(e.target.id);
  },
  render: function () {
    return (
      <li key={this.props.paymentMethodKey}>
        <span>{this.props.paymentMethod.description}</span>
        <label>
          Amount
          <input name={this.props.paymentMethodKey} type="text" defaultValue="0.00" onBlur={this.handleAmountChange} />
        </label>
        <div>
          <button>Edit</button>
          <button id={this.props.paymentMethodKey} onClick={this.handleRemovePayment}>Remove</button>
        </div>
      </li>
    );
  }
});

var PaymentList = React.createClass({displayName: 'PaymentList',
  handleAmountChange: function (e) {
    var paymentMethodKey = e.target.name,
        newValue = e.target.value;

    if (newValue === '' || isNaN(newValue)) {
      newValue = "0.00";
    } else {
      newValue = parseFloat(newValue)
      newValue = newValue.toFixed(2);
    }

    e.target.value = newValue;
    this.props.onAmountUpdated(paymentMethodKey, newValue);
  },
  handleRemovePayment: function (paymentMethodKey) {
    this.props.onPaymentRemoved(paymentMethodKey);
  },
  render: function () {
    var paymentMethods = this.props.paymentMethods,
        paymentMethodKeys = Object.keys(paymentMethods),
        paymentMethodItems = paymentMethodKeys.map(function (paymentMethodKey) {
          var paymentMethod = paymentMethods[paymentMethodKey];
          return (
            <PaymentMethodItem key={paymentMethodKey}
              paymentMethodKey={paymentMethodKey}
              paymentMethod={paymentMethod}
              handleAmountChange={this.handleAmountChange}
              handleRemovePayment={this.handleRemovePayment} />
          )
        }.bind(this));

    return (
      <ul>
        {paymentMethodItems}
      </ul>
    )
  }
});

var Payment = React.createClass({displayName: 'PaymentContainer',
  loadAvailablePaymentMethods: function () {
    var data = {
        "1_1": {schemeId: 1, membershipId: 1, description: 'Visa X-1111'},
        "1_2": {schemeId: 1, membershipId: 2, description: 'Visa X-1234'},
        "Cash": {schemedId: 0, membershipId: 0, description: 'Pay At Restaurant'}
      };

    if (this.state.showTip) {
      var availableTipMethods = Object.keys(data).filter(function (paymentKey) {
        return paymentKey !== "Cash";
      }).map(function (paymentKey) {
        return data[paymentKey];
      });

      this.setState({availableTipMethods: availableTipMethods});
    }

    this.setState({availablePaymentMethods: data});
  },
  handleSelectedPaymentMethod: function (paymentMethod) {
    var selectedPaymentMethods = this.state.selectedPaymentMethods,
        hasSplitPayments = this.state.hasSplitPayments,
        paymentKey = paymentMethod.schemeId + "_" + paymentMethod.membershipId;

    if (selectedPaymentMethods.hasOwnProperty(paymentKey)) {
      return;
    }

    if (!hasSplitPayments) {
      selectedPaymentMethods = {};
    }

    paymentMethod.amount = hasSplitPayments ? 0.00 : this.state.total;
    selectedPaymentMethods[paymentKey] = paymentMethod;
    this.setState({selectedPaymentMethods: selectedPaymentMethods});
  },
  handleSelectedTipMethod: function (paymentMethod) {
    //TODO: Update display
  },
  calculateRemainingBalance: function (total, amounts) {
    var currentBalance = 0,
        remainder;

    amounts.forEach(function (amount) {
      currentBalance += amount;
    });

    remainder = total - currentBalance;
    return "$" + parseFloat(remainder).toFixed(2);
  },
  updateRemainingBalance: function () {
    var subTotal = this.state.total,
        tip = this.state.tip,
        totalBalance = subTotal + tip,
        selectedPaymentMethods = this.state.selectedPaymentMethods,
        selectedPaymentMethodKeys = Object.keys(selectedPaymentMethods),
        currentAmounts,
        remainingBalance;

    currentAmounts = selectedPaymentMethodKeys.map(function (paymentMethodKey) {
      return parseFloat(selectedPaymentMethods[paymentMethodKey].amount);
    });

    remainingBalance = this.calculateRemainingBalance(totalBalance, currentAmounts);
    this.setState({remainingBalance: remainingBalance});

    if (remainingBalance === "$0.00") {
      this.setState({isPlaceOrderedDisabled: false});
    }
  },
  handleUpdatedPaymentAmount: function (paymentMethodKey, amount) {
    var selectedPaymentMethods = this.state.selectedPaymentMethods,
        paymentMethod;

    if(!selectedPaymentMethods.hasOwnProperty(paymentMethodKey)) {
      return;
    }

    paymentMethod = selectedPaymentMethods[paymentMethodKey];
    paymentMethod.amount = amount;

    this.setState({selectedPaymentMethods: selectedPaymentMethods});
    this.updateRemainingBalance();
  },
  handlePaymentRemoved: function (paymentMethodKey) {
    var selectedPaymentMethods = this.state.selectedPaymentMethods;

    if(!selectedPaymentMethods.hasOwnProperty(paymentMethodKey)) {
      return;
    }

    delete selectedPaymentMethods[paymentMethodKey];
    this.setState({selectedPaymentMethods: selectedPaymentMethods});
    this.updateRemainingBalance();
  },
  getInitialState: function() {
    return {
      hasSplitPayments: true,
      showTip: true,
      availablePaymentMethods: {},
      selectedPaymentMethods: {},
      availableTipMethods: {},
      selectedTipMethod: null,
      total: 25.75,
      remainingBalance: 25.75,
      tip: 0,
      tipMethod: null,
      isPlaceOrderedDisabled: true
    };
  },
  componentDidMount: function () {
    this.loadAvailablePaymentMethods();
  },
  render: function () {
    var tipForm = React.createElement('div');
    var placeOrderButtonOptions = {};
    if (this.state.isPlaceOrderedDisabled) {
      placeOrderButtonOptions['disabled'] = 'disabled';
    }

    if (this.state.showTip && Object.keys(this.state.selectedPaymentMethods).length >= 1) {
      tipForm = React.createElement(PaymentTipForm, {
        tipMethods: this.state.availableTipMethods,
        onPaymentSelected: this.handleSelectedTipMethod
      });
    }

    return (
        <div className="payment-container">
          <PaymentSelector paymentMethods={this.state.availablePaymentMethods}
            onPaymentSelected={this.handleSelectedPaymentMethod} />

          <PaymentList paymentMethods={this.state.selectedPaymentMethods}
            onAmountUpdated={this.handleUpdatedPaymentAmount}
            onPaymentRemoved={this.handlePaymentRemoved} />

          {tipForm}

          <hr />
          <button {...placeOrderButtonOptions}>Place Order</button>
          <span>Remainder Due:{this.state.remainingBalance}</span>
        </div>
      );
  }
});
ReactDOM.render(
  React.createElement(Payment, null),
  document.getElementById('content')
);
