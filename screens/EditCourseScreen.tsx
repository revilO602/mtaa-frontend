import {ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View} from "react-native";
import Colors from "../constants/Colors";
import {Controller, useForm} from 'react-hook-form';
import Input from "../components/Input";
import * as React from "react";
import {useEffect, useState} from "react";
import DescriptionInput from "../components/DescriptionInput";
import {Picker} from '@react-native-picker/picker';
import Server from "../constants/Server";
import {encode} from "base-64";
import SubmitButton from "../components/SubmitButton";
import { genTimeBlock } from 'react-native-timetable';
import TimeslotAdder from "../components/TimeslotAdder";
import {WEEK_DAYS} from "../constants/Weekdays";
import getOverlappingTimeslots from "../helpers/timeslotChecker"
import TimeslotDeleter from "../components/TimeslotDeleter";
import alert from "../components/alert";
import { email, password} from "../store/state";
import TimetableWrapper from "../components/TimetableWrapper";

export default function EditCourseScreen({navigation, route}) {
  const {
    control,
    handleSubmit,
    formState: {errors, isValid},
    setValue
  } = useForm({mode: "onBlur"})
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(route.params.course.category.id);
  const [categories, setCategories] = useState([]);
  const [timeslots, setTimeslots] = useState(route.params.course.timeslots)
  const [events, setEvents] = useState(route.params.events)

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${Server.url}/courses/categories`,{
        headers: new Headers({
          'Authorization': 'Basic '+ encode(`${email.get()}:${password.get()}`),
        }),
      });
      if (response.status === 200){
        const json = await response.json()
        setCategories(json)
      } else {
        const json = await response.json()
        let errors = ''
        for (var key of Object.keys(json)) {
          errors = errors + `${json[key]}\n`
        }
        alert("Error", errors)
      }
    } catch (error) {
      alert("Server error", "SERVER ERROR");
    }
  }
  const putCourse = async (data) => {
    try {
      const response = await fetch(`${Server.url}/courses/${route.params.course.id}`,{
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic '+ encode(`${email.get()}:${password.get()}`),
        },
        body: JSON.stringify(data)
      });
      if (response.status === 204){
        navigation.navigate('TeacherCoursesScreen')
        alert('Course edited', "Course successfully edited")
      }
      else{
        const json = await response.json()
        let errors = ''
        for (var key of Object.keys(json)) {
          errors = errors + `${json[key]}\n`
        }
        alert("Error", errors)
      }
    } catch (error) {
      console.log(error)
      alert("Server error", "SERVER ERROR");
    }
  }

  const renderCategories = () => {
    const items = []
    for (let category of categories){
      items.push(<Picker.Item label={category.name} value={category.id} key={category.id}/>)
    }
    return items
  }

  const postTimeslot = async (day, hour, minute) => {
    try {
      const response = await fetch(`${Server.url}/courses/${route.params.course.id}/timeslots`,{
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic '+ encode(`${email.get()}:${password.get()}`),
        },
        body: JSON.stringify({
          weekDay: day.full,
          startTime: `${hour.toString()}:${minute.toString().padStart(2, '0')}`
        })
      });
      if (response.status === 201){
        let json = await response.json()
        let endHour
        let endDay
        if (hour === 23){
          endHour = 0
          if(day.short === "SUN"){
            endDay=WEEK_DAYS[0]
          }
          else {
            endDay = WEEK_DAYS[WEEK_DAYS.indexOf(day)+1]
          }
        }
        else{
          endHour = hour + 1
          endDay = day
        }
        let newTimeslot = {
          id: json.id,
          weekDay: day.full,
          startTime: `${hour.toString()}:${minute.toString().padStart(2, '0')}`
        }
        setEvents([...events, {
          title: `${hour.toString()}:${minute.toString().padStart(2, '0')} - ${endHour.toString()}:${minute.toString().padStart(2, '0')}`,
          startTime: genTimeBlock(day.short, hour, minute),
          endTime: genTimeBlock(endDay.short, endHour, minute),
          timeslot: newTimeslot,
        }])
        setTimeslots([...timeslots, newTimeslot])
        setAddModalVisible(false)
      }
      else{
        const json = await response.json()
        let errors = ''
        for (var key of Object.keys(json)) {
          if (key === "overlappingTimeslots"){
            let overlapsText = ''
            for (let timeslotPair of json[key]){
              overlapsText += `${timeslotPair[0].weekDay}, ${timeslotPair[0].startTime} and ${timeslotPair[1].weekDay}, ${timeslotPair[1].startTime}\n`
            }
            errors = errors + `${overlapsText}\n`
          }
          else errors = errors + `${json[key]}\n`
        }
        alert("Error", errors)
      }
    } catch (error) {
      console.log(error)
      alert("Server error", "SERVER ERROR");
    }
  }

  const deleteTimeslotDb = async (timeslotId) => {
    try {
      const response = await fetch(`${Server.url}/courses/${route.params.course.id}/timeslots/${timeslotId}`,{
        method: 'DELETE',
        headers: new Headers({
          'Authorization': 'Basic '+ encode(`${email.get()}:${password.get()}`),
        }),
      });
      if (response.status === 204){
        console.log("yesss")
        setTimeslots(timeslots.filter(timeslot => timeslot.id !== timeslotId))
        setEvents(events.filter(ev => ev.timeslot.id !== timeslotId))
        setDeleteModalVisible(false)
      }
      else{
        console.log(response.status)
        const json = await response.json()
        let errors = ''
        for (var key of Object.keys(json)) {
          errors = errors + `${json[key]}\n`
        }
        alert("Error", errors)
      }
    } catch (error) {
      console.error(error);
      alert('Server error', 'SERVER ERROR')
    }
  }

  const createTimeslot = (day, hour, minute) =>{
    let overlaps = getOverlappingTimeslots([...timeslots, {
      weekDay: day.full,
      startTime: `${hour.toString()}:${minute.toString().padStart(2, '0')}`
    }])
    if (overlaps.length > 0){
      let overlapsText = ''
      for (let timeslotPair of overlaps){
        overlapsText += `${timeslotPair[0].weekDay}, ${timeslotPair[0].startTime} and ${timeslotPair[1].weekDay}, ${timeslotPair[1].startTime}\n`
      }
      alert("Overlapping timeslots",
        `Can't create timeslot because these timeslots would overlap:\n${overlapsText}`)
      return
    }
    postTimeslot(day, hour, minute)
  }
  const deleteTimeslot = (event) =>{
    console.log(event.timeslot.id)
    deleteTimeslotDb(event.timeslot.id)
  }

  const confirm = async (data: FormData) => {
    if (timeslots.length < 1){
      alert("No timeslots", "Please add at least one timeslot")
      return
    }
    const course = {
      name: data.name,
      description: data.description,
      categoryId: selectedCategory,
    }
    await putCourse(course)
  }

  const showTimeslotAdder = () => {
    setAddModalVisible(true)
  }
  const showTimeslotDeleter = () => {
    setDeleteModalVisible(true)
  }

  useEffect(() => {
    fetchCategories();
    renderCategories();
    setValue('name', route.params.course.name)
    setValue('description', route.params.course.description)
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps={"always"}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => {
          setAddModalVisible(!addModalVisible);
        }}>
        <TimeslotAdder setModalVisible={setAddModalVisible} createTimeslot={createTimeslot}/>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => {
          setDeleteModalVisible(!deleteModalVisible);
        }}>
        <TimeslotDeleter setModalVisible={setDeleteModalVisible} deleteTimeslot={deleteTimeslot} events={events}/>
      </Modal>
      <Controller
        control={control}
        name="name"
        render={({field: {onChange, value, onBlur}}) => (
          <Input
            label={"Name"}
            placeholder="Enter course name..."
            value={value}
            onBlur={onBlur}
            onChangeText={(value: any) => onChange(value)}
            inputStyle={{minWidth: 320}}
            errors={errors}
            name={"name"}
          />
        )}
        rules={{
          required: {
            value: true,
            message: "name is required"
          },
        }}
      />
      <Controller
        control={control}
        name="description"
        render={({field: {onChange, value, onBlur}}) => (
          <DescriptionInput
            value={value}
            onBlur={onBlur}
            onChangeText={(value: any) => onChange(value)}
            errors={errors}
          />
        )}
        rules={{
          required: {
            value: true,
            message: "description is required"
          },
        }}
      />
      <Text style={styles.label}>Category</Text>
      <View style={styles.picker}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue, itemIndex) =>
              setSelectedCategory(itemValue)
            }>
            {renderCategories()}
          </Picker>
      </View>
      <Text style={styles.label}>Timeslots</Text>
      <View style={{marginHorizontal: 5}}>
          <TimetableWrapper course={route.params.course} events={events} onEventPress={null}/>
      </View>
      <Text style={styles.bottomText}>Changes to timeslots will persist even without confirming!</Text>
      <View style={styles.timeslotButtonsContainer}>
        <SubmitButton text={"Add timeslot"} onPress={showTimeslotAdder}/>
        <SubmitButton text={"Delete timeslot"} onPress={showTimeslotDeleter}/>
      </View>
      <View style={styles.buttonContainer}>
        <SubmitButton text={"Confirm"} onPress={handleSubmit(confirm)}/>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background
  },
  picker: {
    marginHorizontal: 22,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 5
  },
  label: {
    fontSize: 12,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: Colors.tabIconDefault,
    textAlign: "left",
    marginVertical: 3,
    marginHorizontal: 22,
  },
  buttonContainer: {
    alignItems: "flex-end",
    marginLeft: "auto",
    marginRight: 15,
    marginBottom: 5
  },
  timeslotButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  bottomText: {
    color: Colors.tabIconSelected,
    fontWeight: 'bold',
    textAlign: 'left',
    marginHorizontal: 10,
    marginBottom: 10,
    fontSize: 20
  },
  headerStyle: {
    backgroundColor: Colors.tabIconSelected
  },
});
