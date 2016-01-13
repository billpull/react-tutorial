var PaymentSelector = React.createClass({displayName: 'PaymentSelector',
  handleSelection: function (e) {
    var paymentMethodKey = e.target.value,
        paymentMethods = this.props.paymentMethods;

    this.props.onPaymentSelected(paymentMethods[paymentMethodKey]);
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

var PaymentMethodItem = React.createClass({displayName: 'PaymentMethodItem',
  handlePaymentMethodSelected: function (paymentMethod) {
    var currentPaymentMethod = this.state.selectedPaymentMethod;

    this.setState({selectedPaymentMethod: paymentMethod}, function () {
      if (paymentMethod === undefined) {
        this.props.onDeSelectPayment(currentPaymentMethod);
        return;
      }

      this.props.onPaymentSelected(paymentMethod);
    });
  },
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
  handleRemovePayment: function (e) {
    this.props.handleRemovePayment(e.target.id);
  },
  getInitialState: function () {
    return {
      selectedPaymentMethod: {}
    };
  },
  render: function () {
    var paymentMethodControls = "";
    if (this.state.selectedPaymentMethod &&
        Object.keys(this.state.selectedPaymentMethod).length > 0) {
      var paymentMethodKey = this.state.selectedPaymentMethod.schemeId + "_" + this.state.selectedPaymentMethod.membershipId;
      var splitPaymentControls = "";

      if (this.props.hasSplitPayments) {
        splitPaymentControls = (
          <label>
            Amount
            <input name={paymentMethodKey} type="text"
              defaultValue="0.00" onBlur={this.handleAmountChange} />
          </label>
        );
      }

      paymentMethodControls = (
        <div>
          {splitPaymentControls}

          <div>
            <button>Edit</button>
            <button id={paymentMethodKey} onClick={this.handleRemovePayment}>Remove</button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <PaymentSelector
          paymentMethods={this.props.paymentMethods}
          onPaymentSelected={this.handlePaymentMethodSelected} />
        {paymentMethodControls}
      </div>
    );
  }
});

var PaymentTipForm = React.createClass({displayName: 'PaymentTipForm',
  updateTip: function (e) {
    var tipValue = e.target.value;
    console.log(tipValue);
  },
  updateTipPercentage: function (percentage) {
    console.log(percentage);
  },
  render: function () {
    var tipInputs = "";

    var tipPercentages = (
      <div>
        <button onClick={this.updateTipPercentage.bind(this, 10)}>10%</button>
        <button onClick={this.updateTipPercentage.bind(this, 15)}>15%</button>
        <button onClick={this.updateTipPercentage.bind(this, 20)}>20%</button>
      </div>
    );

    if (this.props.hasSplitPayments) {
      tipInputs = (
        <div>
          <PaymentMethodItem
            hasSplitPayments={this.props.hasSplitPayments}
            paymentMethods={this.prop.tipMethods} />

          {tipPercentages}
        </div>
      );
    } else {
      var tipValue: this.props.tip && this.props.tip > 0 ? this.props.tip : "0.00";

      tipInputs = (
        <div>
          <input type="text" value={value} defaultValue="0.00" onBlur={this.updateTip} />
          {tipPercentages}
        </div>
      );
    }

    return (
      <div>
        <hr />
        <h2>Add Tip</h2>
        {tipInputs}
      </div>
    );
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
    this.setState({selectedPaymentMethods: selectedPaymentMethods}, function () {
      this.updateRemainingBalance();
    });
  },
  handleDeSelectedPaymentMethod: function (paymentMethod) {
    var selectedPaymentMethods = this.state.selectedPaymentMethods,
        paymentKey = paymentMethod.schemeId + "_" + paymentMethod.membershipId;

    if (!selectedPaymentMethods.hasOwnProperty(paymentKey)) {
      return;
    }

    delete selectedPaymentMethods[paymentKey];

    this.setState({selectedPaymentMethods: selectedPaymentMethods}, function () {
      this.updateRemainingBalance();
    });
  },
  handleSelectedTipMethod: function (paymentMethod) {
    paymentMethod.includesTip = true;
    this.handleSelectedPaymentMethod(paymentMethod);
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

    this.setState({selectedPaymentMethods: selectedPaymentMethods}, function () {
        this.updateRemainingBalance();
    });
  },
  handlePaymentRemoved: function (paymentMethodKey) {
    var selectedPaymentMethods = this.state.selectedPaymentMethods;

    if(!selectedPaymentMethods.hasOwnProperty(paymentMethodKey)) {
      return;
    }

    delete selectedPaymentMethods[paymentMethodKey];
    this.setState({selectedPaymentMethods: selectedPaymentMethods}, function () {
      this.updateRemainingBalance();
    });
  },
  getInitialState: function() {
    return {
      hasSplitPayments: false,
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
    var tipForm = "";
    var remainderNotification = "";

    var placeOrderButtonOptions = {};
    if (this.state.isPlaceOrderedDisabled) {
      placeOrderButtonOptions['disabled'] = 'disabled';
    }

    if (this.state.showTip && Object.keys(this.state.selectedPaymentMethods).length >= 1) {
      tipForm = (
        <PaymentTipForm
          tip={this.state.tip}
          hasSplitPayments={this.state.hasSplitPayments}
          tipMethods={this.state.availableTipMethods}
          onPaymentSelected={this.handleSelectedTipMethod}
          onAmountUpdated={this.handleUpdateTipAmount} />
      );
    }

    if (this.state.hasSplitPayments) {
      remainderNotification = (
        <span>Remainder Due:{this.state.remainingBalance}</span>
      );
    }

    return (
        <div className="payment-container">
          <PaymentMethodItem
            hasSplitPayments={this.state.hasSplitPayments}
            paymentMethods={this.state.availablePaymentMethods}
            onPaymentSelected={this.handleSelectedPaymentMethod}
            onDeSelectPayment={this.handleDeSelectedPaymentMethod}
            onAmountUpdated={this.handleUpdatedPaymentAmount} />

          {tipForm}

          <hr />
          <button {...placeOrderButtonOptions}>Place Order</button>
          {remainderNotification}
        </div>
      );
  }
});
ReactDOM.render(
  React.createElement(Payment, null),
  document.getElementById('content')
);
