import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView, Text, StyleSheet, Modal, Alert, Platform } from 'react-native';
import IconFA from 'react-native-vector-icons/FontAwesome';
import Camera from 'react-native-camera';
import { connect } from 'react-redux';

import Field from '../reusable/Field';
import InfoBar from '../reusable/InfoBar';
import Button from '../reusable/Button';
import { screen } from '../../constants';
import Realm from '../realm';
import { addItemLine, clearItemLine } from './ItemLine.actions';
import { clearFooter } from './Footer.actions';
import { clearDate } from '../reusable/DateField.actions';

class ItemLine extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.state.params.header
  });

  constructor(props) {
    super(props);

    this.state = {
      displayBarCodeForm: false,
      modalVisible: false,
      barCodeData: '',
      barCodeItem: {},
      quantity: '',
      itemCost: '',
      totalCost: ''
    };
    // barCodeData: { type: 'EAN_13', data: '0123456789012' }

    this._renderBarCodeReader = this._renderBarCodeReader.bind(this);
    this._addDetailsHandler = this._addDetailsHandler.bind(this);
    this._updateBarCodeFormAndItem = this._updateBarCodeFormAndItem.bind(this);
  }

  componentWillUnmount() {
    // if (this.props.navigation.state.params.screen === screen.requisition) {
    //   this.props.clearItemLine();
    //   this.props.clearFooter();
    //   this.props.clearDate();
    // }
  }

  _renderBarCodeReader() {
    const barCodeTypes = Platform.select({
      ios: [
        'org.gs1.UPC-E',
        'org.iso.Code39',
        'org.iso.Code39Mod43',
        'org.gs1.EAN-13',
        'org.gs1.EAN-8',
        'com.intermec.Code93',
        'org.iso.Code128',
        'org.iso.PDF417',
        'org.iso.QRCode',
        'org.iso.Aztec'
      ],
      android: [
        'aztec',
        'codabar',
        'code128',
        'code39',
        'code39mod43',
        'code93',
        'datamatrix',
        'ean13',
        'ean8',
        'itf',
        'maxicode',
        'pdf417',
        'qr',
        'rss14',
        'rss',
        'upca',
        'upce',
        'upc'
      ]
     });
    return(
      <View>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => this.setState({ modalVisible: false })}>
          <View style={{ flex: 1 }}>
            <View style={styles.barCodeContainer}>
              <Camera
                onBarCodeRead={(e) => this.setState(() => ({
                  barCodeData: e.data, modalVisible: false
                }), this._updateBarCodeFormAndItem) }
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                aspect={Camera.constants.Aspect.fill}
                barCodeTypes={barCodeTypes}>
                <Text style={{
                  alignSelf: 'stretch',
                  borderBottomColor: 'red',
                  borderBottomWidth: 1
                }}></Text>
              </Camera>
            </View>

            <View style={styles.barCodeButtonsContainer}>
              <Button text="Close" onPress={() =>  this.setState({ modalVisible: false })} />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  _addDetailsHandler() {
    if (this.props.navigation.state.params.screen !== screen.requisition) {
      if (parseFloat(this.state.totalCost) === 0 || isNaN(this.state.totalCost)) {
        Alert.alert('Error', 'You cannot save an item whose cost is 0.');
        return;
      }
    } else if (parseInt(this.state.quantity, 10) === 0 ||
               isNaN(parseInt(this.state.quantity, 0))) {
      Alert.alert('Error', 'You cannot save an item with zero quantity.');
      return;
    }

    this.props.addItemLine({
      barCodeData: this.state.barCodeData,
      quantity: parseInt(this.state.quantity, 10),
      itemCost: parseFloat(this.state.itemCost),
      totalCost: parseFloat(this.state.totalCost),
      barCodeItem: this.state.barCodeItem
    });

    this.setState({
      displayBarCodeForm: false,
      barCodeData: '',
      barCodeItem: {},
      quantity: '',
      itemCost: '',
      totalCost: ''
    });
  }

  _updateBarCodeFormAndItem = () => {
    let filter = `barCode=="${this.state.barCodeData}"`
    let foundBarCode = Realm.objects('Item').filtered(filter);

    // This case is extreme use case when the iOS app considers an EAN13 barcode as an UPC-A
    // barcode. UPC-A is 12 digit so iOS prepends extra 0 thus making it 13 characters.
    // Just remove extra 0 from the beginning and search again
    if (!foundBarCode.length && this.state.barCodeData.length === 13) {
      filter = `barCode=="${this.state.barCodeData.substring(1)}"`
      foundBarCode = Realm.objects('Item').filtered(filter);
    }

    if (foundBarCode.length) {
      this.setState({
        displayBarCodeForm: true,
        barCodeItem: foundBarCode[0],
        itemCost: String(foundBarCode[0].unitCost)
      });
    } else {
      this.setState({
        displayBarCodeForm: false,
        barCodeItem: {}
      });
    }
  };

  render() {

    const { params } = this.props.navigation.state;

    return (
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Field value={this.state.barCodeData}
            onChangeText={barCodeData => this.setState({ barCodeData })}
            label="Barcode *" icon="barcode" customStyle={{ minWidth: 180 }}
            onPress={() => this.setState({ modalVisible: true })} />

          <View style={styles.itemLineButtonsContainer}>
            <Button disabled={Object.keys(this.state.barCodeItem).length ? false : true}
            style={{ flex: 1, marginRight: 10}} text="Add details"
            onPress={this._addDetailsHandler} />

            <Button name="list" disabled={this.props.itemLine.itemLines.length ? false: true}
              onPress={() => this.props.navigation.navigate('ScannedItems')} />

            <Button name="arrow-down" style={{ marginLeft: 10}}
              disabled={this.state.barCodeData ? false: true}
              onPress={() => this._updateBarCodeFormAndItem()} />
          </View>

          {
            this.state.displayBarCodeForm &&
              <ScrollView style={{ display: 'flex' }}>
                <Field label="Item Id" iconMCI="alphabetical" editable={false}
                  value={String(this.state.barCodeItem.no)} />

                <Field label="Description" iconMCI="alphabetical" editable={false}
                  value={String(this.state.barCodeItem.description)} customStyle={{ minWidth: 150 }} />

                <Field label="Vendor Id" iconMCI="alphabetical" editable={false}
                  value={String(this.state.barCodeItem.vendorId)} />

                <Field label={`Quantity ${params.screen === screen.return ? 'Returned *' :
                  params.screen === screen.receive ? 'Received *' : 'Required *' }`}
                  iconMCI="numeric"
                  keyboardType="numeric" reference={qr => this._quantity = qr}
                  value={this.state.quantity}
                  onChangeText={(quantity) => {
                    const parsedQuantity = parseInt(quantity, 10);
                    if (parsedQuantity || quantity === '') {
                      this.setState({
                        quantity,
                        totalCost: (parsedQuantity * parseFloat(this.state.itemCost)).toFixed(3)
                      });
                    }
                  }} />

                <Field label="UoM" iconMCI="alphabetical"
                  value={String(this.state.barCodeItem.uom)} editable={false}
                  onPress={() => {
                    if (params.screen === screen.requisition) {
                      if (this.state.barCodeItem.uom === 'PCS') {
                        this.setState({ barCodeItem: { ...this.state.barCodeItem, uom: 'BOX' }});
                      } else {
                        this.setState({ barCodeItem: { ...this.state.barCodeItem, uom: 'PCS' }});
                      }
                    }
                  }} />

                <Field label="pcsWeight" iconMCI="alphabetical"
                  value={String(this.state.barCodeItem.pcsWeight)} editable={false} />

                {
                  params.screen !== screen.requisition &&
                    <View>
                      <Field label="Item Cost *" iconMCI="numeric"
                        reference={iC => this._itemCost = iC} keyboardType="numeric"
                        value={this.state.itemCost}
                        onChangeText={(itemCost) => {
                            this.setState({
                              itemCost,
                              totalCost: (parseFloat(itemCost) * parseInt(this.state.quantity, 10)).toFixed(3)
                            });
                        }} />

                      <Field label="Total Cost" icon="calculator" editable={false}
                        value={!isNaN(this.state.totalCost) ? String(this.state.totalCost) : String(0)} />
                    </View>
                }
              </ScrollView>
          }
        </View>

        <InfoBar screensRemaining={2} onPress={() => {
            if (this.props.itemLine.itemLines.length) {
              this.props.navigation.navigate('Footer', {
                ...params
              })
            } else if (!this.props.itemLine.itemLines.length) {
              Alert.alert('Error', 'At least specify one item.');
            }
          }}
        />

        { this._renderBarCodeReader() }
      </View>
    );
  }
}

PropTypes.propTypes

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemLineButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  formContainer: {
    flex: 1,
    margin: 10,
    height: 100
  },
  barCodeContainer: {
    margin: 10,
    borderColor: 'gray',
    borderWidth: 1, flex: 1
  },
  barCodeButtonsContainer: {
    margin: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: 'space-around'
  }
});

ItemLine.propTypes = {
  itemLine: PropTypes.object.isRequired,
  addItemLine: PropTypes.func.isRequired,
  clearItemLine: PropTypes.func.isRequired,
  clearFooter: PropTypes.func.isRequired,
  clearDate: PropTypes.func.isRequired
};

export default connect(state => ({
  itemLine: state.itemLine
}), { addItemLine, clearItemLine, clearFooter, clearDate })(ItemLine);
