import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView, Text, StyleSheet,
  Image, TextInput, Modal, Alert } from 'react-native';
import IconFA from 'react-native-vector-icons/FontAwesome';
import SignatureCapture from 'react-native-signature-capture';
import Camera from 'react-native-camera';
import { connect } from 'react-redux';

import Sign from '../Sign';
import Field from '../reusable/Field';
import Button from '../reusable/Button';
import InfoBar from '../reusable/InfoBar';
import DateField from '../reusable/DateField';
import { screen } from '../../constants';
import { updateInvoiceValue } from './ItemLine.actions';
import { addInvoiceReferenceImage, addName, addSignatureImage } from './Footer.actions';
import { postToServer } from '../../request';

class Footer extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.state.params.header,
    tabBarIcon: () => <IconFA name="cloud" size={22} />
  });

  constructor(props) {
    super(props);

    this.state = {
        signatureModalVisible: false,
        cameraModalVisible: false,
        totalInvoiceValue: props.itemLine.totalInvoiceValue,
        invoiceReferenceImagePath: '',
        invoiceReferenceImage: '',
        name: '',
        signatureImagePath: '',
        signatureImage: '',
    };

    this._renderSignature = this._renderSignature.bind(this);
    this._renderCamera = this._renderCamera.bind(this);
    this._captureImageHandler = this._captureImageHandler.bind(this);
    this._totalInvoiceChangeHandler = this._totalInvoiceChangeHandler.bind(this);
  }

  componentWillMount() {
    // We rehydrate the internal state with the redux state so that the elements can show the
    // correct data when the user returns to this screen.
    this.setState({ ...this.props.footer });
  }

  componentWillReceiveProps(nextProps) {
    // this is needed as when user updates the new invoice value it triggers a redux store update
    // as you can see in _totalInvoiceChangeHandler() method. So every time comp receive the props
    // we explicitly set that in the internal state so that the TextInput correctly
    // shows the value. This is also required, as the totalInvoiceValue is calculated in the
    // ItemLine.reducer.js, that is separate from this component.
    this.setState({ totalInvoiceValue: nextProps.itemLine.totalInvoiceValue });
  }

  _captureImageHandler() {
    this._camera.capture()
      .then((result) => {
        this.setState({
          invoiceReferenceImagePath: '/storage/emulated/0/../invoice.png',
          invoiceReferenceImage: result.data,
          cameraModalVisible: false
        });
        this.props.addInvoiceReferenceImage({
          data: result.data,
          path: '/storage/emulated/0/../invoice.png'
        });
      })
      .catch(err => console.error('Couldn\'t capture invoice reference image.'));
  }

  _totalInvoiceChangeHandler(totalInvoiceValue)  {
    this.setState({ totalInvoiceValue });
    this.props.updateInvoiceValue(totalInvoiceValue);
  }

  _renderSignature() {
    return(
      <View>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.signatureModalVisible}
          onRequestClose={() =>  this.setState({ signatureModalVisible: false })}>
          <View style={{ flex: 1 }}>
            <View style={styles.modalContainer}>
              <SignatureCapture
                style={{ flex: 1 }}
                ref={sC => this._signatureCapture = sC}
                onSaveEvent={(result) => {
                  this.setState({
                    signatureImagePath: result.pathName,
                    signatureImage: result.encoded,
                    signatureModalVisible: false
                  });
                  this.props.addSignatureImage(result);
                }}
                showNativeButtons={false}
                showTitleLabel={false}
                viewMode={"portrait"}/>
            </View>

            <View style={styles.modalButtonsContainer}>
              <Button text="Save" onPress={() => this._signatureCapture.saveImage()} />
              <Button text="Reset" onPress={() => this._signatureCapture.resetImage()} />
              <Button text="Close" onPress={() =>
                this.setState({ signatureModalVisible: false })} />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  _renderCamera() {
    return(
      <View>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.cameraModalVisible}
          onRequestClose={() => this.setState({ cameraModalVisible: false })}>
          <View style={{ flex: 1 }}>
            <View style={styles.modalContainer}>
              <Camera
                ref={c => this._camera = c}
                style={{ flex: 1 }}
                aspect={Camera.constants.Aspect.fill}
                captureTarget={Camera.constants.CaptureTarget.memory} />
            </View>

            <View style={styles.modalButtonsContainer}>
              <Button text="Capture" onPress={this._captureImageHandler} />
              <Button text="Close" onPress={() =>  this.setState({ cameraModalVisible: false })} />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  render() {
    const { params } = this.props.navigation.state;

    return (
      <View style={styles.container}>
        <ScrollView style={styles.formContainer}>
          {
            params.screen !== screen.requisition &&
              <Field label="Total Invoice Value (KWD) *" iconMCI="numeric" editable={true}
                value={String(this.state.totalInvoiceValue)}
                onChangeText={this._totalInvoiceChangeHandler} />
          }

          {
            params.screen === screen.receive &&
              <Field label="Invoice Reference Image" icon="picture-o" editable={false}
                value={this.state.invoiceReferenceImagePath}
                onPress={() => this.setState({ cameraModalVisible: true })} />
          }

          {
            params.screen === screen.requisition && <DateField />
          }

          <Field label="Staff Name *" iconMCI="alphabetical" value={this.state.name}
            reference={sName => this._staffName = sName}
            onChangeText={(name) => {
              this.setState({ name });
              this.props.addName(name);
            }} />

          <Field label="Signature *" iconMCI="pen" editable={false}
            value={this.state.signatureImagePath}
            onPress={() => this.setState({ signatureModalVisible: true })} />

        </ScrollView>

        <InfoBar text="Submit" screensRemaining={1} onPress={() => {
          if (!this.state.name) {
            Alert.alert('Error', 'Please provide the staff name.');
            this._staffName.focus();
            return;
          }

          if (!this.state.signatureImage) {
            Alert.alert('Error', 'Please provide the signature.');
            return;
          }

          this.props.navigation.navigate('Review', {
            ...params
          })}
         } />


        { this._renderSignature() }
        { this._renderCamera() }
      </View>
    );
  }
}

Footer.propTypes = {
  itemLine: PropTypes.object.isRequired,
  footer: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    margin: 10,
    height: 100
  },
  modalContainer: {
    margin: 10,
    borderColor: 'gray',
    borderWidth: 1, flex: 1
  },
  modalButtonsContainer: {
    margin: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: 'space-around'
  }
});

export default connect(state => ({
  itemLine: state.itemLine,
  footer: state.footer,
}), { updateInvoiceValue, addInvoiceReferenceImage, addName, addSignatureImage })(Footer);
